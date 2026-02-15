export default {
  meta: {
    type: "problem",
    docs: {
      description: "オプショナル型（?）の使用を禁止する",
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      noOptionalType:
        "オプショナル型（?）の使用は禁止されています。代わりに明示的なユニオン型を使用してください。",
    },
  },
  create(context) {
    function checkOptionalProperty(node) {
      if (node.optional === true) {
        context.report({
          node,
          messageId: "noOptionalType",
        });
      }
    }

    return {
      TSPropertySignature: checkOptionalProperty,
      TSParameterProperty: checkOptionalProperty,
      TSMethodSignature: checkOptionalProperty,
      TSCallSignatureDeclaration: checkOptionalProperty,
      TSConstructSignatureDeclaration: checkOptionalProperty,
      TSIndexSignature: checkOptionalProperty,
    };
  },
};
