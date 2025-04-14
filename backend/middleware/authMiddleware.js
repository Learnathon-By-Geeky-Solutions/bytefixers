const jwt = require("jsonwebtoken");
const appConfig = require("../config/appConfig");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("Authorization Header:", authHeader); // Log the header for debugging
  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1]; // Expecting 'Bearer <token>'
  console.log("Token:", token); // Log the token for debugging
  if (!token) {
    return res
      .status(401)
      .json({ message: "Unauthorized: Invalid token format" });
  }
  console.log(appConfig.AUTH.JWT_SECRET);
  jwt.verify(token, appConfig.AUTH.JWT_SECRET, (err, payload) => {
    if (err) {
      console.log("JWT Verification Error:", err.message);
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }

    req.user = payload;
    next();
  });
};

module.exports = { authenticateToken };
