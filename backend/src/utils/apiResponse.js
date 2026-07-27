const apiResponse = (res, statuscode, message, data = null) => {
  const response = {
    success: statuscode >= 200 && statuscode < 300,
    status: statuscode,
    timestamp: new Date().toISOString(),
    message: message,
    data: data,
  };
  return res.status(statuscode).json(response);
};

module.exports = apiResponse;