const jwt = require("jsonwebtoken");
const JwtConfig = require("../config/jwt.config");
const apiResponse = require("../utils/apiResponse");

function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization;   
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return apiResponse(res, 401, "No token provided");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JwtConfig.accessSecret);
    req.user = decoded;
    next();
  } catch (error) {
    return apiResponse(res, 401, "Invalid or expired token");
  }
}






module.exports = authenticateUser;