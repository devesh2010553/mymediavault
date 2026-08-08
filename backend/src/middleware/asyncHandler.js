// Express 4 does not automatically catch rejected promises thrown from
// async route handlers — without this, an error thrown inside e.g.
// cloudinaryService (auth failure, network failure, deletion failure)
// would leave the request hanging instead of reaching errorHandler and
// returning the clear JSON error the caller needs.
function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
