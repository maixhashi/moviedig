export default {
  meta: {
    type: "problem",
    docs: {
      description: "undefined型の使用を禁止する",
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      noUndefinedType:
        "undefined型の使用は禁止されています。代わりにnullやオプショナル型を使用してください。",
    },
  },
  create(context) {
    function checkUndefinedType(node) {
      if (node.type === "TSUndefinedKeyword") {
        context.report({
          node,
          messageId: "noUndefinedType",
        });
      }
    }

    return {
      TSUndefinedKeyword: checkUndefinedType,
      TSUnionType(node) {
        node.types.forEach((type) => {
          if (type.type === "TSUndefinedKeyword") {
            context.report({
              node: type,
              messageId: "noUndefinedType",
            });
          }
        });
      },
    };
  },
};
