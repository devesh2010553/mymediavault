function notFound(req, res, _next) {
  res.status(404).json({ error: "Not found" });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  console.error("[error]", err.message);
  const status = err.status || 500;
  res.status(status).json({
    error: err.publicMessage || "Internal server error",
  });
}

module.exports = { notFound, errorHandler };
