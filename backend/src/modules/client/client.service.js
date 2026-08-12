const clientRepository = require("./client.repository");

/**
 * Service: Resolves active Client / Tenant object by subdomain
 */
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

/**
 * Service: Retrieves Client details by ID
 */
async function getClientById(id) {
  const client = await clientRepository.findById(id);
  if (!client || !client.is_active) {
    throw new Error("Client not found or inactive");
  }
  return client;
}

/**
 * Service: Records active relationship between user and client (is_active = 1)
 */
async function recordUserClientRelation(userId, clientId) {
  return clientRepository.recordUserClientRelation(userId, clientId);
}

/**
 * Service: Deactivates relationship between user and client (is_active = 0)
 */
async function deactivateUserClientRelation(userId, clientId) {
  return clientRepository.deactivateUserClientRelation(userId, clientId);
}

module.exports = {
  resolveClientBySubdomain,
  getClientById,
  recordUserClientRelation,
  deactivateUserClientRelation,
};
