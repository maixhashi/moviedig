export default {
  meta: {
    type: "problem",
    docs: {
      description: "unknown型の使用を禁止する",
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      noUnknownType:
        "unknown型の使用は禁止されています。適切な型を指定するか、zodスキーマを使用してバリデーションしてください。",
    },
  },
  create(context) {
    function checkUnknownType(node) {
      if (node.type === "TSUnknownKeyword") {
        context.report({
          node,
          messageId: "noUnknownType",
        });
      }
    }

    return {
      TSUnknownKeyword: checkUnknownType,
      TSUnionType(node) {
        node.types.forEach((type) => {
          if (type.type === "TSUnknownKeyword") {
            context.report({
              node: type,
              messageId: "noUnknownType",
            });
          }
        });
      },
    };
  },
};

