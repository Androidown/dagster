import functools
import itertools

import textwrap
from typing import List, Optional, Dict, NamedTuple, Any, TYPE_CHECKING, Iterable

from .steps import Step
from . import node

if TYPE_CHECKING:
    from .context import ContextLevel
else:
    ContextLevel = Any


NodeRef = str
CONTEXT = "__DATA_CONTEXT__"


def wrap_in_function(code: str, name: str) -> str:
    return "\n".join((
        f"def {name}():",
        textwrap.indent(code.rstrip(), " "*4),
    ))


class CodeObject:
    def __init__(
        self,
        name: str,
        outputs: List[NodeRef],
    ):
        self.name = name
        self.outputs = outputs

    @property
    def code(self) -> str:
        return ""

    def call(self) -> str:
        return ""

    def into_asset(self, prefix: List[str]) -> Optional[str]:
        return None


class FunctionCode(CodeObject):
    def __init__(
        self,
        name: str,
        body: str,
        outputs: List[NodeRef],
        arguments: List[str] = None,
    ):
        super().__init__(name, outputs)
        self._body = body
        self._args = arguments or []
        self._aux_data = {}

    def _get_decorator(self) -> Optional[str]:
        return

    @property
    def code(self) -> str:
        return "\n".join(filter(
            None,
            [
                self._get_decorator(),
                f"def {self.name}({', '.join(self._args)}):",
                textwrap.indent(self._body, " " * 4)
            ]
        ))

    @property
    def _dependencies(self) -> Iterable[str]:
        return self._args

    def call(self) -> str:
        args = (
            f"{arg}={CONTEXT}.{arg}"
            for arg in self._dependencies
        )
        return f"{CONTEXT}.{self.name} = {self.name}({', '.join(args)})"

    def into_asset(self, prefix: List[str]) -> Optional[str]:
        return f"{self.name!r}: AssetOut(key_prefix={prefix!r})"


class OpCode(FunctionCode):
    decorator = "op"

    def __init__(
        self,
        *args,
        namespace: List[str],
        deps: Optional[List[str]] = None,
        optdeps: Optional[List[str]] = None,
        **kwargs,
    ):
        super().__init__(*args, **kwargs)

        self._deps = deps or []
        self._optdeps = optdeps or []
        self._qualname = "_".join(namespace + [self.name])

    def add_dep(self, dep: str):
        self._deps.append(dep)

    @property
    def _dependencies(self) -> Iterable[str]:
        return itertools.chain(self._args, self._optdeps, self._deps, )

    @functools.cached_property
    def _deco_args(self) -> List[str]:
        deco_args = [f"name={self._qualname!r}"]
        deps = []
        if self._deps:
            deps.extend((
                f"{name!r}: In(Nothing)"
                for name in self._deps
            ))
        if self._optdeps:
            deps.extend((
                f"{name!r}: In(Nothing, is_required=False)"
                for name in self._optdeps
            ))

        if deps:
            deco_args.append("ins={%s}" % ', '.join(deps))
        return deco_args

    def _get_decorator(self) -> Optional[str]:
        return f"@{self.decorator}({', '.join(self._deco_args)})"


class IfElseCode(OpCode):
    def __init__(self, *args, tail_nodes: List[NodeRef], **kwargs):
        super().__init__(*args, **kwargs)
        fname = "__INTERNAL_FLAG__"
        expr_fn = wrap_in_function(self._body, fname)
        self._body = textwrap.dedent(f"""\
            %s
            
            if __INTERNAL_FLAG__():
                yield Output(True, "true")
            else:
                yield Output(False, "false")
        """) % textwrap.dedent(expr_fn)
        self.tail_nodes = tail_nodes

    @functools.cached_property
    def _deco_args(self) -> List[str]:
        deco_args = super()._deco_args
        deco_args.append(
            "out={'true': Out(is_required=False), 'false': Out(is_required=False)}"
        )
        return deco_args

    def into_asset(self, prefix: List[str]) -> Optional[str]:
        return None

    def call(self) -> str:
        args = (f"{CONTEXT}.{arg}" for arg in self._args)
        return f"{CONTEXT}.{self.name}_true, {CONTEXT}.{self.name}_false = {self.name}({', '.join(args)})"


class AssetCode(FunctionCode):
    decorator = "asset"

    def __init__(
        self,
        *args,
        key_prefix: List[str],
        dep: Optional[str] = None,
        **kwargs,
    ):
        super().__init__(*args, **kwargs)
        self._key_prefix = key_prefix
        self._dep = dep

    @functools.cached_property
    def _deco_args(self) -> List[str]:
        deco_args = [f"key_prefix={self._key_prefix}"]
        if self._dep is not None:
            deco_args.append(f"deps=[{self._dep!r}]")
        return deco_args

    def _get_decorator(self) -> Optional[str]:
        return f"@{self.decorator}({', '.join(self._deco_args)})"


class MultiAssetCode(AssetCode):
    decorator = "multi_asset"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._outs = []
        self._counter = itertools.count(1).__next__

    def create_out(self, hint: str = None) -> str:
        if not hint:
            hint = f"{self._counter():03}"

        self._outs.append(name := f"{self.name}_{hint}")
        return name

    @functools.cached_property
    def _deco_args(self) -> List[str]:
        if self._dep is None:
            deco_args = []
        else:
            deco_args = [f"deps=[{self._dep!r}]"]
        out_tmpl = f"AssetOut(is_required=False, key_prefix={self._key_prefix})"
        out_assets = ','.join(f"{out!r}: {out_tmpl}" for out in self._outs)
        deco_args.append(f"outs={{{out_assets}}}")
        return deco_args


class Import(NamedTuple):
    module: str
    names: List[str] = None

    def __str__(self):
        if not self.names:
            return f"import {self.module}"
        else:
            return f"from {self.module} import {', '.join(self.names)}"


class CodeNode(node.NodeMixin):
    def __init__(self, code: CodeObject):
        self.code = code

    def __str__(self):
        return f"Node({self.code.name})"


class CodeBlock:
    def __init__(
        self,
        ctx: ContextLevel,
        namespace: List[str],
        imports: List[Import] = None,
    ) -> None:
        self._codes: Dict[Step, CodeObject] = {}
        self._imports = imports or []
        self._flow: List[str] = []
        self._namespace = namespace
        self._ctx = ctx
        self._graph_fn_name = f"__{'_'.join(namespace).upper()}_GRAPH__"

    def add(self, step: Step, code: CodeObject):
        self._codes[step] = code

    def generate(self) -> str:
        imports = '\n'.join(map(str, self._imports))
        body = '\n\n'.join(blk.code for blk in self._codes.values())
        return '\n'.join((
            imports,
            body,
            self._gen_graph(),
            self._gen_jobs(),
        ))

    def get(self, step: Step) -> Optional[CodeObject]:
        return self._codes.get(step, None)

    def add_imports(self, *imps: Import):
        self._imports.extend(imps)

    def _gen_graph(self):
        assets = ",\n".join(filter(
            None,
            (code.into_asset(self._namespace) for code in self._codes.values())
        ))
        returns = ",\n".join((
            f'"{code.name}": {CONTEXT}.{code.name}' for code in self._codes.values()
            if code.into_asset(self._namespace)
        ))

        def create_code_tree() -> CodeNode:
            code_nodes: Dict[Step: CodeNode] = {}

            ctx = self._ctx
            root = CodeNode(CodeObject('__root__', []))
            for step, step_parent in ctx.step_hierarchy.items():
                if (code_obj := self.get(step)) is None:
                    continue

                cnode = code_nodes.setdefault(step, CodeNode(code_obj))
                if (pcode := self.get(step_parent)) is None:
                    parent = root
                else:
                    parent = code_nodes.setdefault(step_parent, CodeNode(pcode))
                cnode.set_parent(parent)
            return root

        lines = "\n".join(n.code.call() for n in create_code_tree().descendant)
        return textwrap.dedent(f"""
            @graph_multi_asset(outs={{
            %s
            }})
            def {self._graph_fn_name}():
                {CONTEXT} = type('{CONTEXT}_TYPE_', (), {{}})
            %s
                return {{
            %s
                }}
        """) % (
            textwrap.indent(assets, " " * 4),
            textwrap.indent(lines, " " * 4),
            textwrap.indent(returns, " " * 8),
        )

    def _gen_jobs(self) -> str:
        qualname = "_".join(self._namespace + ['entry'])
        return "\n".join([
            f'job = define_asset_job({qualname!r}, selection=[{self._graph_fn_name}])',
        ])
