import weakref


class LoopError(Exception):
    pass


class TreeError(Exception):
    pass


class NodeMixin:
    @property
    def parent(self):
        """父节点"""
        try:
            return self.__parent()
        except AttributeError:
            return None

    @property
    def ichildren(self):
        """返回节点的直接孩子节点，包含自身"""
        return [self, *self.children]

    @property
    def children(self):
        """返回当前节点的直接孩子节点，不包含自身，当前节点无孩子则返回空列表"""
        try:
            return self.__children
        except AttributeError:
            self.__children = []
            return self.__children

    def set_parent(self, node):
        """
        将指定的节点设为父节点。
        如果当前节点已有父节点，将首先把当前节点（及其子树）从原树中移除，
        再把当前节点（及其子树）接入新的树中。

        Args:
            node: 待设定的父节点

        """
        if node is not None and not isinstance(node, NodeMixin):
            raise TreeError(f"父节点 {node!r} 不是 '{self.__class__.__name__}'.")

        if self.parent is not node:
            self._check_loop(node)
            self._detach(self.parent)
            self._attach(node)

    def add_child(self, node):
        """
        将指定的节点设为孩子节点。
        如果指定节点已有父节点，将首先把指定节点（及其子树）从原树中移除，
        再把指定节点（及其子树）接入新的树中。

        Args:
            node: 待设定的孩子节点
        """
        if not isinstance(node, NodeMixin):
            raise TreeError(f"子节点 {node!r} 不是 '{self.__class__.__name__}'.")

        if node not in self.children:
            node._check_loop(self)
            node._detach(node.parent)
            node._attach(self)

    def _check_loop(self, new_parent):
        if new_parent is None:
            return
        if new_parent is self:
            raise LoopError("父节点不能为自身.")
        if any(ancestor is self for ancestor in new_parent.iter_to_root()):
            raise LoopError(f"无法设置父节点. {self!r}已经是{new_parent!r}的祖先.")

    def _detach(self, parent):
        if parent is None:
            return

        try:
            parent.children.remove(self)
        except ValueError:
            raise TreeError("Tree is corrupt.")

    def _attach(self, new_parent):
        """将一棵树连接到父结点上"""
        if new_parent is None:
            return  # 不用做任何操作，因为parent默认就是None

        parentchildren = new_parent.children

        if any(child is self for child in parentchildren):
            raise TreeError("Tree is corrupt.")
        parentchildren.append(self)
        self.__parent = weakref.ref(new_parent)

    def iter_to_root(self):
        """从当前节点迭代至根节点，包括自身。返回生成器。"""
        node = self
        while node is not None:
            yield node
            node = node.parent

    def iter_descendants(self, include=False):
        """先序遍历所有后代节点，不包括自身。返回节点列表有顺序"""
        if include:
            yield self
        for child in self.children:
            if child is not None:
                yield from child.iter_descendants(include=True)

    def iter_from_root(self):
        """从根节点迭代至当前节点，包括自身。"""
        for node in reversed(list(self.iter_to_root())):
            yield node

    #: 祖先节点
    ancestors = property(lambda self: tuple(self.iter_to_root())[1:])
    #: 节点在树中的深度
    depth = property(lambda self: len(self.ancestors))
    #: tuple: 后代节点
    descendant = property(lambda self: list(self.iter_descendants()))
    #: tuple: 后代节点，包括自身
    idescendant = property(lambda self: list(self.iter_descendants(include=True)))

    #: 根节点
    root = property(lambda self: list(self.iter_to_root())[-1])

    def iter_base(self):
        """遍历当前子树的所有叶子节点"""
        for node in self.iter_descendants():
            if node.is_leaf:
                yield node

    #: 子树的所有叶子节点
    base = property(lambda self: list(self.iter_base()))

    @property
    def ibase(self):
        """子树的所有叶子节点，包含节点自身。"""
        return [self, *self.base]

    @property
    def siblings(self):
        """
        兄弟节点，不包含自身。

        Returns:
            tuple: 如有，返回所有兄弟节点；否则返回空元组

        """
        parent = self.parent
        if parent is None:
            return tuple()
        else:
            return tuple(node for node in parent.children if node is not self)

    #: 是否叶子节点
    is_leaf = property(lambda self: not bool(self.children))
    #: 是否根节点
    is_root = property(lambda self: self.parent is None)
    #: tuple: 同一颗树的所有节点
    family = property(lambda self: self.root.idescendant)

    def iter_to_descendant(self, descendant):
        """
        遍历自身到后代节点所经过的所有节点，不包括自身。

        Args:
            descendant: 后代节点

        Raises:
            descendant不是自己或自己的后代时，抛出 `ValueError` 异常

        Note:
            传入 `descendant==self` 并不会引起错误，但也不会返回任何节点
        """
        found = False

        for antr in descendant.iter_from_root():
            if found:
                yield antr
            else:
                if antr is not self:
                    continue
                else:
                    found = True

        if found is False:
            raise ValueError(f"{descendant!r}不是{self!r}的后代")


def bfs(node, depth=-1, include=True):
    """
    广度优先遍历树

    Args:
        node(NodeMixin): 遍历以 ``node`` 为根节点的维度树
        depth(int): 遍历的深度
        include(bool): 是或否包含自身

    Returns:
        返回生成器，包含遍历到的所有节点
    """
    if depth == 0:
        return
    elif depth > 0:
        depth += node.depth + 1

    if include:
        yield node

    node_to_visit = node.children[:]

    while node_to_visit:
        child = node_to_visit.pop(0)
        if child.depth == depth:
            break

        yield child

        for grandchild in child.children:
            node_to_visit.append(grandchild)


class TreeRenderer:
    """渲染树形结构"""
    def __init__(self):
        self.blank = '    '
        self.low = '└── '
        self.mid = '├── '
        self.gap = '|   '
        self.len = len(self.blank)

    def iter_line(self, root, sty='', fill=''):
        yield fill[:-self.len] + sty * (len(fill) > 0) + str(root)

        child_num = len(root.children)
        for idx, child in enumerate(root.children, 1):
            if idx == child_num:
                yield from self.iter_line(child, sty=self.low, fill=fill + self.blank)
            else:
                yield from self.iter_line(child, sty=self.mid, fill=fill + self.gap)

    def render(self, root) -> str:
        """
        渲染树结构

        Args:
            root(NodeMixin): 树的根节点

        Examples:
            .. code-block:: python

                # dim.root 为需要打印的维度树的根节点
                print(TreeRenderer().render(dim.root))
                # 经过上述定义后，将形成如下树结构
                '''
                #root
                └── TotalPeriod
                    └── Q1
                        ├── 1
                        ├── 2
                        └── 3
                '''
        """
        if isinstance(root, NodeMixin):
            return '\n'.join(self.iter_line(root))
        else:
            raise TypeError(f'{root.__class__.__name__}不是NodeMixin或MetaNodeMixin')

    def show(self, root):
        """打印树结构"""
        print(self.render(root))
