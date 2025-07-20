const express = require('express');
const { check, validationResult } = require('express-validator');
const { register, login } = require('../controllers/authController');
const router = express.Router();

// Rota: /api/auth/register
router.post(
  '/register',
  [
    check('name', 'Name is required').notEmpty(),
    check('email', 'Valid email is required').isEmail(),
    check('password', 'Password min length 6').isLength({ min: 6 }),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    next();
  },
  register
);

// Rota: /api/auth/login
router.post(
  '/login',
  [
    check('email', 'Valid email is required').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    next();
  },
  login
);

module.exports = router;
