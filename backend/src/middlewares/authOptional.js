const jwt = require('jsonwebtoken');

module.exports = function authOptional(req, _res, next) {
  try {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (token) {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: payload.id, email: payload.email };
    }
  } catch {}
  next();
};
