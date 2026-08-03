const clientRepository = require("./client.repository");

async function resolveClientBySubdomain(subdomain) {
  if (!subdomain) {
    return null;
  }
  const client = await clientRepository.findBySubdomain(subdomain);
  if (!client || !client.is_active) {
    return null;
  }
  return client;
}

async function getClientById(id) {
  const client = await clientRepository.findById(id);
  if (!client || !client.is_active) {
    throw new Error("Client not found or inactive");
  }
  return client;
}

async function recordUserClientRelation(userId, clientId) {
  return clientRepository.recordUserClientRelation(userId, clientId);
}

module.exports = {
  resolveClientBySubdomain,
  getClientById,
  recordUserClientRelation,
};
