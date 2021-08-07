const handleError = (message, res) => {
  res.status(500).json({ error: message });
};

module.exports = {
  handleError,
};
