const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const appConfig = require("../config/appConfig");
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
router.post("/login", async (req, res) => {
  try {
    const { type, email, password, refreshToken } = req.body;
    if (type == "email") {
      const user = await User.findOne({ email: email });
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
      return;
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
