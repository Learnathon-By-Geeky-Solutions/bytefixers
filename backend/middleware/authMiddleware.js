const jwt = require("jsonwebtoken");
require("dotenv").config();
export function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ message: "Unauthorized" });
  } else {
    const token = authHeader && authHeader.split(" ")[1];
    if (token) {
      jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
        if (err) {
          res.status(401).json({ message: "Unauthorized" });
        } else {
          req.user = payload;
          next();
        }
      });
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  }
}
