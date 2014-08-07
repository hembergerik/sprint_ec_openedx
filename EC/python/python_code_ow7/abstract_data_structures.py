#! /usr/bin/env python
# -*- coding: utf-8 -*-

class TreeNode(object):
    """
    A node in a tree.

    Attributes:
      - Parent -- The parent of the node. None indicates no parent, i.e. root node
      - Symbol -- The label of the node
      - Children -- The children of the node
    """

    def __init__(self, parent=None, symbol=None):
        """
        Constructor

        :param parent: Parent node
        :type parent: TreeNode
        :param symbol: Node symbol
        :type symbol: Symbol
        """
        # The parent of the tree node
        self.parent = parent
        # The symbol of the node (a.k.a label)
        self.symbol = symbol
        # The children of the node
        self.children = []


def preorder_traversal(root):
    """
    Preorder traversal of a tree starting with the root. The traversal
    is depth-first left-to-right.

    :param root: Root node of the tree
    :type root: TreeNode
    """
    stack = []
    stack.append(root)
    cnt = 0
    while len(stack) > 0:
        node = stack.pop()
        cnt += 1
        print('cnt:%d, symbol:%s' % (cnt, node.symbol))
        node.children.reverse()
        for child in node.children:
            stack.append(child)

def recursive_preorder_traversal(node, cnt=0):
    """
    Return the count of nodes traversed. Preorder traversal of a
    tree starting with recursion. The traversal is depth-first
    left-to-right.

    :param root: Root node of the tree
    :type root: TreeNode
    :param cnt: Count of number of nodes that have been traversed
    :type cnt: int
    :returns: Count of number of nodes that have been tra
    """
    cnt += 1
    print('cnt:%d, symbol:%s' % (cnt, node.symbol))
    for child in node.children:
        cnt = recursive_preorder_traversal(child, cnt)

    return cnt

def reversed_preorder_traversal(root):
    """
    Reverse preorder traversal of a tree starting with the root. The traversal
    is depth-first right-to-left.

    :param root: Root node of the tree
    :type root: TreeNode
    """
    stack = []
    stack.append(root)
    cnt = 0
    while len(stack) > 0:
        node = stack.pop()
        cnt += 1
        print('cnt:%d, symbol:%s' % (cnt, node.symbol))
        for child in node.children:
            stack.append(child)

def recursive_reversed_preorder_traversal(node, cnt=0):
    """
    Return the count of nodes traversed. Reversed preorder traversal of a
    tree starting with recursion. The traversal is depth-first
    right-to-left.

    :param root: Root node of the tree
    :type root: TreeNode
    :param cnt: Count of number of nodes that have been traversed
    :type cnt: int
    :returns: Count of number of nodes that have been tra
    """
    cnt += 1
    print('cnt:%d, symbol:%s' % (cnt, node.symbol))
    node.children.reverse()
    for child in node.children:
        cnt = recursive_postorder_traversal(child, cnt)

    return cnt

def recursive_postorder_traversal(node, cnt=0):
    """Return the count of nodes traversed. Postorder traversal of a tree
    starting with recursion. First traverse left subtree, then rigth
    subtree and finally root.

    :param root: Root node of the tree
    :type root: TreeNode
    :param cnt: Count of number of nodes that have been traversed
    :type cnt: int
    :returns: Count of number of nodes that have been tra

    """
    for child in node.children:
        cnt = recursive_postorder_traversal(child, cnt)

    cnt += 1
    print('cnt:%d, symbol:%s' % (cnt, node.symbol))
    return cnt

def breadth_first_traversal(root):
    """
    Breadth first traversal of a tree starting with the root. The traversal
    is breadth-first left-to-right.

    :param root: Root node of the tree
    :type root: TreeNode
    """
    queue = []
    queue.insert(0, root)
    cnt = 0
    while len(queue) > 0:
        node = queue.pop()
        cnt += 1
        print('cnt:%d, symbol:%s' % (cnt, node.symbol))
        for child in node.children:
            queue.insert(0, child)

def get_tree():
    """
    Return a TreeNode. Creates a tree.
    """
    root = TreeNode(None,'A')
    root.children.append(TreeNode(root, 'B'))
    root.children.append(TreeNode(root, 'C'))
    root.children[0].children.append(TreeNode(root.children[0], 'D'))
    root.children[0].children.append(TreeNode(root.children[0], 'E'))
    return root

def main():
    """
    Show different traversals of a tree.
    """
    root = get_tree()
    print("Preorder traversal")
    preorder_traversal(root)
    root = get_tree()
    print("Preorder traversal (recursive)")
    recursive_preorder_traversal(root)
    root = get_tree()
    print("Breadth first traversal")
    breadth_first_traversal(root)
    print("Reverse preorder traversal")
    reversed_preorder_traversal(root)
    root = get_tree()
    print("Reverse preorder traversal (recursive)")
    recursive_reversed_preorder_traversal(root)
    root = get_tree()
    print("Postorder traversal (recursive)")
    recursive_postorder_traversal(root)
    
    
if __name__ == '__main__':
    main()
