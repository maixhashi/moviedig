export default {
  meta: {
    type: "problem",
    docs: {
      description: "else ifブロックの使用を禁止する",
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      noElseIf:
        "else ifブロックの使用は禁止されています。早期リターンやガード句を使用してください。",
    },
  },
  create(context) {
    return {
      IfStatement(node) {
        if (
          node.parent &&
          node.parent.type === "IfStatement" &&
          node.parent.alternate === node
        ) {
          context.report({
            node,
            messageId: "noElseIf",
          });
        }
      },
    };
  },
};
