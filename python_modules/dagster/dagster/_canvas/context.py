#
# This source file is part of the EdgeDB open source project.
#
# Copyright 2008-present MagicStack Inc. and the EdgeDB authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#


from __future__ import annotations

import enum
from typing import *

from .codegen import CodeBlock, NodeRef, CodeObject
from .steps import Step


class Mode(enum.Enum):
    NEW_BRANCH = enum.auto()
    NEW_SCOPE = enum.auto()


class Branch(enum.Enum):
    TRUE = enum.auto()
    FALSE = enum.auto()
    NULL = enum.auto()


class ContextLevel:
    _stack: Context

    #: global variables those are visible at current scope
    globals: FrozenSet[NodeRef]
    #: local variables those are visible at current scope
    locals: Set[NodeRef]
    #: namespace of current step, use as dagster asset's key prefix
    namespace: List[str]
    # code blocks
    code_block: CodeBlock
    # last_node
    last_step: Optional[Step]

    branch_type: Optional[Branch]

    top_step: Optional[Step]

    current_step: Optional[Step]
    #: step -> step's parent
    step_hierarchy: Dict[Step, Step]

    def __init__(
        self,
        prevlevel: Optional[ContextLevel],
        mode: Optional[Mode], *,
        top_step: Step = None,
        namespace: List[str] = None,
    ) -> None:
        self.locals = set()

        if prevlevel is None:
            self.globals = frozenset()
            self.namespace = namespace
            self.code_block = CodeBlock(self, namespace)
            self.last_step = None
            self.branch_type = None
            self.top_step = top_step
            self.step_hierarchy = {}
            self.current_step = None
        else:
            self.globals = prevlevel.globals
            self.namespace = prevlevel.namespace
            self.code_block = prevlevel.code_block
            self.last_step = prevlevel.last_step
            self.branch_type = prevlevel.branch_type
            self.top_step = prevlevel.top_step
            self.step_hierarchy = prevlevel.step_hierarchy
            self.current_step = prevlevel.current_step

        if mode is Mode.NEW_BRANCH:
            self.globals |= prevlevel.locals
            self.branch_type = None
            self.top_step = None

    def on_pop(
        self,
        prevlevel: Optional[ContextLevel],
    ) -> None:
        pass

    def new(
        self,
        mode: Optional[Mode] = None,
    ) -> CompilerContextManager[ContextLevel]:
        return self._stack.new(mode, self)  # type: ignore

    def new_branch(self):
        return self.new(Mode.NEW_BRANCH)

    def reenter(
        self,
    ) -> CompilerReentryContextManager[ContextLevel]:
        return CompilerReentryContextManager(self._stack, self)  # type: ignore

    @property
    def parent_step(self) -> Optional[Step]:
        return self.step_hierarchy.get(self.current_step, None)


class CompilerContextManager(ContextManager[ContextLevel]):
    def __init__(
        self,
        context: Context,
        mode: Optional[Mode],
        prevlevel: Optional[ContextLevel],
    ) -> None:
        self.context = context
        self.mode = mode
        self.prevlevel = prevlevel

    def __enter__(self) -> ContextLevel:
        return self.context.push(self.mode, self.prevlevel)

    def __exit__(self, exc_type: Any, exc_value: Any, traceback: Any) -> None:
        self.context.pop()


class CompilerReentryContextManager(ContextManager[ContextLevel]):
    def __init__(
        self,
        context: Context,
        level: ContextLevel,
    ) -> None:
        self.context = context
        self.level = level

    def __enter__(self) -> ContextLevel:
        return self.context._push(None, initial=self.level)

    def __exit__(self, exc_type: Any, exc_value: Any, traceback: Any) -> None:
        self.context.pop()


class Context:
    stack: List[ContextLevel]
    ContextLevelClass: Type[ContextLevel] = ContextLevel
    default_mode: Optional[Mode] = None

    def __init__(self, initial: ContextLevel) -> None:
        self.stack = []
        self._push(None, initial=initial)

    def push(
        self,
        mode: Optional[Mode],
        prevlevel: Optional[ContextLevel] = None,
    ) -> ContextLevel:
        return self._push(mode, prevlevel)

    def _push(
        self,
        mode: Optional[Mode],
        prevlevel: Optional[ContextLevel] = None,
        *,
        initial: Optional[ContextLevel] = None,
    ) -> ContextLevel:
        if initial is not None:
            level = initial
        else:
            if prevlevel is None:
                prevlevel = self.current
            elif prevlevel is not self.current:
                # In the past, we always used self.current as the
                # previous level and simply ignored the prevlevel
                # parameter. Actually using prevlevel makes more sense
                # and has fewer gotchas, but enough code had grown to
                # depend on the old behavior that changing it required
                # asserting that they were the same.  We can consider
                # dropping the assertion if it proves tedious.
                raise AssertionError(
                    'Calling new() on a context other than the current one')
            level = self.ContextLevelClass(prevlevel, mode)
        level._stack = self  # type: ignore
        self.stack.append(level)
        return level

    def pop(self) -> None:
        level = self.stack.pop()
        level.on_pop(self.stack[-1] if self.stack else None)

    def new(
        self,
        mode: Optional[Mode] = None,
        prevlevel: Optional[ContextLevel] = None,
    ) -> CompilerContextManager[ContextLevel]:
        if mode is None:
            mode = self.default_mode
        return CompilerContextManager(self, mode, prevlevel)

    @property
    def current(self) -> ContextLevel:
        return self.stack[-1]
