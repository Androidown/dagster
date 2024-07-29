import ast
import builtins
import contextlib
import itertools
from typing import List, FrozenSet


class DependencyCollector(ast.NodeVisitor):
    def __init__(self, locals: FrozenSet[str] = frozenset()):
        self._stack = [set(), ]
        self._deps = set()
        self._locals = locals
        self._globals = set(dir(builtins))
        self._dangling_refs = set()

    @contextlib.contextmanager
    def enter_function(self, fundef: ast.FunctionDef):
        self._stack.append(ids := set(fundef.name))
        funargs = fundef.args

        for arg in itertools.chain(
            funargs.args,
            funargs.kwonlyargs,
            funargs.posonlyargs
        ):
            ids.add(arg.arg)

        for arg in [funargs.vararg, funargs.kwarg]:
            if arg is not None:
                ids.add(arg.arg)

        try:
            yield
        finally:
            self._stack.pop()

    def _add_identifier(self, identifier: str):
        self._stack[-1].add(identifier)

    def is_identifier_visible(self, identifier: str) -> bool:
        for ids in reversed(self._stack):
            if identifier in ids:
                return True
        return False

    def visit_FunctionDef(self, node: ast.FunctionDef):
        with self.enter_function(node):
            self.generic_visit(node)

    def visit_Assign(self, node: ast.Assign):
        for target in node.targets:
            if isinstance(target, ast.Name):
                self._add_identifier(target.id)

    def visit_AnnAssign(self, node: ast.AnnAssign):
        if isinstance(target := node.target, ast.Name):
            self._add_identifier(target.id)

    def visit_NamedExpr(self, node: ast.NamedExpr):
        self._add_identifier(node.target.id)
        self.generic_visit(node.value)

    def visit_Name(self, node: ast.Name):
        if not self.is_identifier_visible(node.id):
            if node.id in self._locals:
                self._deps.add(node.id)
            elif node.id not in self._globals:
                self._dangling_refs.add(node.id)

    def _visit_import_names(self, names: List[ast.alias]):
        for name in names:
            if name.asname is not None:
                self._add_identifier(name.asname)
            else:
                self._add_identifier(name.name)

    def visit_ImportFrom(self, node: ast.ImportFrom):
        self._visit_import_names(node.names)

    def visit_Import(self, node: ast.Import):
        self._visit_import_names(node.names)

    @property
    def dependencies(self) -> List[str]:
        return list(self._deps)

    @property
    def dangling_refs(self) -> FrozenSet[str]:
        return frozenset(self._dangling_refs)

