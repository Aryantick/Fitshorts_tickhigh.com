require("dotenv").config();
module.exports = {
  baseUrl: process.env.TELECOM_BASE_URL,
  serviceId: process.env.TELECOM_SERVICE_ID,
  cpId: process.env.TELECOM_CP_ID,
  channel: process.env.TELECOM_CHANNEL,
  country: process.env.TELECOM_COUNTRY,
  operator: process.env.TELECOM_OPERATOR,
  reqType: process.env.TELECOM_REQ_TYPE,
  language: process.env.TELECOM_LANGUAGE,
};