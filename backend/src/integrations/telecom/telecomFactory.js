const ZainProvider = require("./providers/zain.provider");

function getTelecomProvider(config) {
  if (!config || !config.provider_key) {
    throw new Error("Telecom configuration or provider_key is required");
  }

  const providerKey = config.provider_key.toUpperCase();

  switch (providerKey) {
    case "ZAIN":
      return new ZainProvider(config);
    default:
      throw new Error(`Unsupported telecom provider key: ${config.provider_key}`);
  }
}

module.exports = {
  getTelecomProvider,
};
