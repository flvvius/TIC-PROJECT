const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: "No token. Please log in." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("AuthMiddleware - Error verifying token:", error.message);
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

module.exports = { authMiddleware };
