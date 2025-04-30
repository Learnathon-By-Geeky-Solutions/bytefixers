const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const appConfig = require("../config/appConfig");
const router = express.Router();
const { OAuth2Client } = require("google-auth-library");

// Create a Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Handle Google Authentication
router.post("/google-login", async (req, res) => {
  try {
    const { token, email, name, picture } = req.body;

    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    // Get user data from the token
    const payload = ticket.getPayload();
    const userId = payload["sub"];

    console.log("Google token verified for:", payload.email);

    // Check if user already exists
    let user = await User.findOne({ email: payload.email });

    // If user doesn't exist, create a new user
    if (!user) {
      console.log("Creating new user for Google login:", payload.email);
      user = new User({
        name: payload.name,
        email: payload.email,
        profilePicture: payload.picture,
        googleId: userId,
        authProvider: "google",
        password: await bcrypt.hash(Math.random().toString(36).slice(-8), 10), // Random password
        todoList: [],
      });

      await user.save();
    } else if (!user.googleId) {
      // If user exists but doesn't have a googleId, update it
      user.googleId = userId;
      user.profilePicture = user.profilePicture || payload.picture;
      user.authProvider = user.authProvider || "google";
      await user.save();
    }

    // Generate tokens using your existing function
    const { accessToken, refreshToken } = generateTokens(user);

    // Create response object (similar to your email login)
    const userObj = user.toJSON();
    delete userObj.password;
    userObj["accessToken"] = accessToken;
    userObj["refreshToken"] = refreshToken;

    // Send response
    res.status(200).json(userObj);
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({ message: "Authentication failed" });
  }
});

// Reuse your token generator function
function generateTokens(user) {
  const accessToken = jwt.sign(
    {
      email: user.email,
      _id: user._id,
    },
    appConfig.AUTH.JWT_SECRET,
    {
      expiresIn: "1d",
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
