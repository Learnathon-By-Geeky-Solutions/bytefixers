const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const appConfig = require("../config/appConfig");
const Project = require("../models/Project");
const validator = require("validator");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware"); // Make sure you have this middleware
console.log("AUTH MIDDLEWARE CHECK:", authenticateToken);
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
    if (req.body.projectId) {
      await Project.findByIdAndUpdate(req.body.projectId, {
        $addToSet: { members: user._id },
      });
    }
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message || "Something went wrong" });
  }
});

//? Login a user
router.post("/login", async (req, res) => {
  try {
    const { type, email, password, refreshToken, projectId } = req.body;
    if (type == "email") {
      const sanitizedEmail = validator.normalizeEmail(email);
      const user = await User.findOne({ email: sanitizedEmail });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      await handleEmailLogin(password, user, res, projectId);
    } else {
      // Login using refresh token
      if (!refreshToken) {
        return res
          .status(401)
          .json({ message: "Refresh token is not defined" });
      }
      await handleRefreshToken(refreshToken, res);
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
// get a user by id
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
});
async function handleEmailLogin(password, user, res, projectId) {
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (isValidPassword) {
    const userObj = generateUserObject(user);
    // if (projectId) {
    //   await Project.findByIdAndUpdate(projectId, {
    //     $addToSet: { members: user._id },
    //   });
    // }
    res.json(userObj);
    //todo
  } else {
    res.status(401).json({ message: "Unable to Login" });
  }
}

async function handleRefreshToken(refreshToken, res) {
  jwt.verify(refreshToken, appConfig.AUTH.JWT_SECRET, async (err, payload) => {
    if (err) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await User.findById(payload._id);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userObj = generateUserObject(user);
    res.json(userObj);
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
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, email } = req.body;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate email if changing
    if (email && email !== user.email) {
      if (!validator.isEmail(email)) {
        return res.status(400).json({ message: "Invalid email address" });
      }

      // Check if email already exists for another user
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }

      user.email = validator.normalizeEmail(email);
    }

    // Update other fields if provided
    if (name) user.name = name;
    // if (avatar) user.avatar = avatar;
    // if (bio) user.bio = bio;

    // Save updated user
    await user.save();

    // Return updated user (without password)
    const updatedUser = user.toJSON();
    console.log("Updated user:", updatedUser);
    delete updatedUser.password;

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Error updating profile" });
  }
});

/**
 * @route PUT /api/user/password
 * @desc Update user password
 * @access Private
 */
router.put("/password", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Both current and new password are required" });
    }

    // Password strength validation
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Password update error:", error);
    res.status(500).json({ message: "Error updating password" });
  }
});

/**
 * @route GET /api/user/profile
 * @desc Get current user profile
 * @access Private
 */
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Error retrieving profile" });
  }
});

module.exports = router;
