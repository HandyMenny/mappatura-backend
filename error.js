class HTTPError extends Error {
  constructor(statusCode, message) {
    super();
    this.statusCode = statusCode;
    this.message = message;
  }
}

const handleError = (statusCode, message, res) => {
  res.status(statusCode).json({ error: message });
};

module.exports = {
  HTTPError,
  handleError,
};
