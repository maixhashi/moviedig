export default {
  meta: {
    type: "problem",
    docs: {
      description: "オプショナルチェーン（?.）の使用を禁止する",
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      noOptionalChain: "オプショナルチェーン（?.）の使用は禁止されています。",
    },
  },
  create(context) {
    return {
      ChainExpression(node) {
        if (node.optional) {
          context.report({
            node,
            messageId: "noOptionalChain",
          });
        }
      },
      MemberExpression(node) {
        if (node.optional) {
          context.report({
            node,
            messageId: "noOptionalChain",
          });
        }
      },
    };
  },
};
