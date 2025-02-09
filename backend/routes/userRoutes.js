const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const appConfig = require("../config/appConfig");
const { body, validationResult } = require("express-validator");
const router = express.Router();
const { MongoClient } = require("mongodb");

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
router.post("/login", async (req, res) => {
  try {
    console.log("Login data", req.body);

    const { type, email, password, refreshToken } = req.body;
    if (type == "email") {
      const user = await User.findOne({ email: email }).lean();
      if (!user) {
        res.status(404).json({ message: "User not found" });
      } else {
        await handleEmailLogin(password, user, res);
      }
    } else {
      //? Login using refresh token
      if (!refreshToken) {
        res.status(401).json({ message: "Refresh token is not defined" });
      } else {
        handleRefreshToken(refreshToken, res);
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

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
  try {
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Unable to Login" });
    }

    // ✅ FIX: Convert user to a plain object and generate user object
    const userObj = generateUserObject(user);
    return res.json(userObj);
  } catch (error) {
    console.error("❌ Error in handleEmailLogin:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

async function handleRefreshToken(refreshToken, res) {
  try {
    jwt.verify(
      refreshToken,
      appConfig.AUTH.JWT_SECRET,
      async (err, payload) => {
        if (err) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        // ✅ FIX: Use MongoDB query instead of `User.findById()`
        const client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        const db = client.db(process.env.DB_NAME);
        const user = await db
          .collection("users")
          .findOne({ _id: new ObjectId(payload._id) });

        if (!user) {
          await client.close();
          return res.status(401).json({ message: "Unauthorized" });
        }

        const userObj = generateUserObject(user);
        await client.close();
        return res.json(userObj);
      }
    );
  } catch (error) {
    console.error("❌ Error in handleRefreshToken:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

function generateUserObject(user) {
  // ✅ FIX: Convert user into a plain object to prevent `toJSON` errors
  const userObj = { ...user };

  // Remove sensitive data
  delete userObj.password;

  // Generate Tokens
  const { accessToken, refreshToken } = generateTokens(userObj);

  // Attach tokens to user object
  userObj.accessToken = accessToken;
  userObj.refreshToken = refreshToken;

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
