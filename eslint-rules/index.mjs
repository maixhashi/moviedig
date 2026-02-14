import noOptionalChain from "./no-optional-chain.mjs";
import noElseIf from "./no-else-if.mjs";
import noUndefinedType from "./no-undefined-type.mjs";
import noNullType from "./no-null-type.mjs";
import noUnknownType from "./no-unknown-type.mjs";
import noNeverType from "./no-never-type.mjs";
import noOptionalType from "./no-optional-type.mjs";

export default {
  rules: {
    "no-optional-chain": noOptionalChain,
    "no-else-if": noElseIf,
    "no-undefined-type": noUndefinedType,
    "no-null-type": noNullType,
    "no-unknown-type": noUnknownType,
    "no-never-type": noNeverType,
    "no-optional-type": noOptionalType,
  },
};

