import ast
import dataclasses
import warnings
from typing import Callable

from .analyzer import DependencyCollector
from .codegen import *
from .context import ContextLevel, NodeRef, Branch
from .steps import Step, CodeStep, MapStep, IfElseStep
from .. import DagsterInvalidDefinitionError


@functools.singledispatch
def compile(step: Step, *, ctx: ContextLevel) -> CodeObject:
    raise NotImplementedError(f"no handler for step {type(step)}")


__orig_register__ = compile.register


def register(func: Callable):
    @functools.wraps(func)
    def wrapper(step: Step, *, ctx: ContextLevel):
        ctx.step_hierarchy[step] = ctx.current_step
        ctx.current_step = step
        code: CodeObject = func(step, ctx=ctx)
        ctx.code_block.add(step, code)
        ctx.locals.update(code.outputs)
        ctx.last_step = step
        return code
    return __orig_register__(wrapper)


compile.register = register


@dataclasses.dataclass
class Dependency:
    argument: List[NodeRef] = dataclasses.field(default_factory=list)
    runtime: List[NodeRef] = dataclasses.field(default_factory=list)
    optional: List[NodeRef] = dataclasses.field(default_factory=list)


def inspect_code(
    code: str,
    step: Step,
    ctx: ContextLevel
) -> Dependency:
    collector = DependencyCollector(locals=ctx.globals | ctx.locals)
    collector.visit(ast.parse(code))

    if dangling_refs := collector.dangling_refs:
        raise DagsterInvalidDefinitionError(
            f"step: {step.name} contains unknown reference: {dangling_refs}"
        )

    dep = Dependency(argument=collector.dependencies)

    if (
        ctx.last_step is not None
        and not isinstance(ctx.last_step, (MapStep, IfElseStep))
        and ctx.last_step.name not in collector.dependencies
    ):
        dep.runtime.append(ctx.last_step.name)

    if (
        step is ctx.top_step
        and ctx.branch_type is not None
        and ctx.branch_type != Branch.NULL
    ):
        suffix = "true" if ctx.branch_type == Branch.TRUE else "false"
        dep.runtime.append(f"{ctx.parent_step.name}_{suffix}")

    elif (
        isinstance(ctx.parent_step, IfElseStep)
        and ctx.branch_type is None
    ):
        # this is the ending of an if-else statement
        code_obj = ctx.code_block.get(ctx.parent_step)
        assert isinstance(code_obj, IfElseCode)
        dep.optional.extend(code_obj.tail_nodes)

    return dep


@compile.register
def compile_CodeStep(step: CodeStep, *, ctx: ContextLevel) -> CodeObject:
    if not (code := step.properties.code):
        code = "return"

    wrapped_code = wrap_in_function(code, "__INTERNAL_FUN__")
    dep = inspect_code(wrapped_code, step, ctx)

    return ObservedOpCode(
        name=step.name,
        namespace=ctx.namespace,
        body=code.rstrip(),
        deps=dep.runtime,
        optdeps=dep.optional,
        arguments=dep.argument,
        outputs=[step.name]
    )


@compile.register
def compile_MapStep(step: MapStep, *, ctx: ContextLevel) -> CodeObject:
    visible_refs = []

    for branch in step.branches.values():
        with ctx.new_branch() as new_ctx:
            for branch_step in branch:
                noderefs = compile(branch_step, ctx=new_ctx).outputs
                visible_refs.extend(noderefs)

    return CodeObject(
        name=step.name,
        outputs=visible_refs
    )


@compile.register
def compile_IfElseStep(step: IfElseStep, *, ctx: ContextLevel) -> CodeObject:
    raw = "".join(step.properties.condition.strip().splitlines())
    if not raw.startswith("return"):
        raw = f"return {raw}"

    wrapped_code = wrap_in_function(raw, "__INTERNAL_FN__")
    dep = inspect_code(wrapped_code, step, ctx)

    true_refs = []
    with ctx.new_branch() as new_ctx:
        new_ctx.branch_type = Branch.TRUE
        for idx, tstep in enumerate(step.branches.true):
            if idx == 0:
                new_ctx.top_step = tstep
            true_refs.extend(compile(tstep, ctx=new_ctx).outputs)

    false_refs = []
    with ctx.new_branch() as new_ctx:
        new_ctx.branch_type = Branch.FALSE
        for idx, fstep in enumerate(step.branches.false):
            if idx == 0:
                new_ctx.top_step = fstep
            false_refs.extend(compile(fstep, ctx=new_ctx).outputs)

    tail_nodes = []
    if true_refs:
        tail_nodes.append(true_refs[-1])

    if false_refs:
        tail_nodes.append(false_refs[-1])

    code = IfElseCode(
        name=step.name,
        namespace=ctx.namespace,
        body=raw,
        outputs=list(set(true_refs) & set(false_refs)),
        deps=dep.runtime,
        arguments=dep.argument,
        tail_nodes=tail_nodes
    )

    return code



