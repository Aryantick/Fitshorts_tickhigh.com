const telecomConfigRepository = require("./telecomConfig.repository");

async function getTelecomConfigByClientId(clientId) {
  if (!clientId) {
    throw new Error("Client ID is required to fetch telecom configuration");
  }

  const config = await telecomConfigRepository.findConfigByClientId(clientId);
  if (!config) {
    throw new Error(`Telecom configuration not found for client ID: ${clientId}`);
  }

  // Parse extra_config if stored as string JSON
  let extraConfig = config.extra_config;
  if (typeof extraConfig === "string") {
    try {
      extraConfig = JSON.parse(extraConfig);
    } catch (e) {
      console.error("Failed to parse extra_config JSON:", e.message);
    }
  }

  return {
    ...config,
    extra_config: extraConfig || {},
  };
}

module.exports = {
  getTelecomConfigByClientId,
};
