const ZainProvider = require("./providers/zain.provider");
const OrangeProvider = require("./providers/orange.provider");
const DialogSLProvider = require("./providers/dialogsl.provider");

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
    default:
      throw new Error(`Unsupported telecom provider key: ${config.provider_key}`);
  }
}

module.exports = {
  getTelecomProvider,
};
