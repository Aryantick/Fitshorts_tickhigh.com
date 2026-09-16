const ZainProvider = require("./providers/zain.provider");
const OrangeProvider = require("./providers/orange.provider");
const DialogSLProvider = require("./providers/dialogsl.provider");
const OoredooPalestineProvider = require("./providers/ooredoo_palestine.provider");
const JordanOrangeProvider = require("./providers/jordan_orange.provider");

function getTelecomProvider(config) {
  if (!config || !config.provider_key) {
    throw new Error("Telecom configuration or provider_key is required");
  }

  const providerKey = config.provider_key.toUpperCase();

  switch (providerKey) {
    case "ZAIN":
      return new ZainProvider(config);
    case "ORANGE_BF":
    case "ORANGE":
      return new OrangeProvider(config);
    case "DIALOG_SL":
    case "DIALOG":
    case "DSL":
      return new DialogSLProvider(config);
    case "OOREDOO_PALESTINE":
    case "UNIVERSE":
    case "PALESTINE":
    case "OPAL":
      return new OoredooPalestineProvider(config);
    case "JORDAN_ORANGE":
    case "ZORDAN_ORANGE":
    case "ORANGE_JO":
    case "ORJO":
    case "BEECELL_ORANGE":
    case "BEECELL":
      return new JordanOrangeProvider(config);
    default:
      throw new Error(`Unsupported telecom provider key: ${config.provider_key}`);
  }
}

module.exports = {
  getTelecomProvider,
};
