export default {
  meta: {
    type: "problem",
    docs: {
      description: "never型の使用を禁止する",
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      noNeverType:
        "never型の使用は禁止されています。適切な型を指定してください。",
    },
  },
  create(context) {
    function checkNeverType(node) {
      if (node.type === "TSNeverKeyword") {
        context.report({
          node,
          messageId: "noNeverType",
        });
      }
    }

    return {
      TSNeverKeyword: checkNeverType,
      TSUnionType(node) {
        node.types.forEach((type) => {
          if (type.type === "TSNeverKeyword") {
            context.report({
              node: type,
              messageId: "noNeverType",
            });
          }
        });
      },
    };
  },
};
