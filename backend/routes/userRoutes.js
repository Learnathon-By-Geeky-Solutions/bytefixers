const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const appConfig = require("../config/appConfig");
const { body, validationResult } = require("express-validator");
const router = express.Router();

router.post("/sign-up", async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(req.body.password, salt);
    const userObj = {
      name: req.body.name,
      email: req.body.email,
      password: hash,
      todoList: [],
    };
    const user = new User(userObj);
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message || "Something went wrong" });
  }
});

//? Login a user
router.post(
  "/login",
  [
    body("email").optional().isEmail().normalizeEmail(), // Validate email if provided
    body("password").optional().isString().trim(), // Ensure password is a string
    body("refreshToken").optional().isString().trim(), // Ensure refreshToken is a string
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { type, email, password, refreshToken } = req.body;

      if (type === "email") {
        // Ensure email is provided
        if (!email) {
          return res.status(400).json({ message: "Email is required" });
        }

        // Securely query user
        const user = await User.findOne({ email: { $eq: email } }).lean();
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Proceed with login
        await handleEmailLogin(password, user, res);
      } else if (type === "refreshToken") {
        // Ensure refresh token is provided
        if (!refreshToken) {
          return res.status(401).json({ message: "Refresh token is required" });
        }

        // Process refresh token login
        handleRefreshToken(refreshToken, res);
      } else {
        return res.status(400).json({ message: "Invalid login type" });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

//? Get all user
router.get("/", async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
});
async function handleEmailLogin(password, user, res) {
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (isValidPassword) {
    const userObj = generateUserObject(user);
    res.json(userObj);
    //todo
  } else {
    res.status(401).json({ message: "Unable to Login" });
  }
}

function handleRefreshToken(refreshToken, res) {
  jwt.verify(refreshToken, appConfig.AUTH.JWT_SECRET, async (err, payload) => {
    if (err) {
      res.status(401).json({ message: "Unauthorized" });
    } else {
      const user = await User.findById(payload._id);
      if (user) {
        const userObj = generateUserObject(user);
        res.json(userObj);
      } else {
        res.status(401).json({ message: "Unauthorized" });
      }
    }
  });
}

function generateUserObject(user) {
  const { accessToken, refreshToken } = generateTokens(user);

  const userObj = user.toJSON();
  delete userObj.password;
  userObj["accessToken"] = accessToken;
  userObj["refreshToken"] = refreshToken;
  return userObj;
}

function generateTokens(user) {
  const accessToken = jwt.sign(
    {
      email: user.email,
      _id: user._id,
    },
    appConfig.AUTH.JWT_SECRET,
    {
      expiresIn: "5m",
    }
  );
  const refreshToken = jwt.sign(
    {
      email: user.email,
      _id: user._id,
    },
    appConfig.AUTH.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
  return { accessToken, refreshToken };
}

module.exports = router;
