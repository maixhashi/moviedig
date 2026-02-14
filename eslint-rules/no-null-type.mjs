export default {
  meta: {
    type: "problem",
    docs: {
      description: "null型の使用を禁止する",
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      noNullType:
        "null型の使用は禁止されています。代わりにオプショナル型やユニオン型を使用してください。",
    },
  },
  create(context) {
    function checkNullType(node) {
      if (node.type === "TSNullKeyword") {
        context.report({
          node,
          messageId: "noNullType",
        });
      }
    }

    return {
      TSNullKeyword: checkNullType,
      TSUnionType(node) {
        node.types.forEach((type) => {
          if (type.type === "TSNullKeyword") {
            context.report({
              node: type,
              messageId: "noNullType",
            });
          }
        });
      },
    };
  },
};
