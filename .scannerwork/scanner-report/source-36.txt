import React, { useState, useEffect } from "react";
import { authServices } from "../../auth";
import { toast } from "react-toastify";
import {
  Avatar,
  Button,
  TextField,
  Paper,
  Typography,
  Divider,
  Box,
  CircularProgress,
} from "../../common/icons";
import { appConfig } from "../../common/config";

export const UserProfile = () => {
  const [user, setUser] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    bio: "",
    avatar: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    // Get current user data
    const currentUser = authServices.getAuthUser();
    if (currentUser) {
      setUser(currentUser);
      setFormData({
        name: currentUser.name || "",
        email: currentUser.email || "",
        bio: currentUser.bio || "",
        avatar: currentUser.avatar || "",
      });
      setLoading(false);
    } else {
      // If no user in local storage, fetch from API
      fetchUserProfile();
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = authServices.getRefreshToken();
      const response = await fetch("http://localhost:4000/api/user/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const userData = await response.json();
      setUser(userData);
      setFormData({
        name: userData.name || "",
        email: userData.email || "",
        bio: userData.bio || "",
        avatar: userData.avatar || "",
      });
    } catch (error) {
      toast.error("Error loading profile: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value,
    });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    try {
      setUpdating(true);
      const token = authServices.getRefreshToken();
      const response = await fetch("http://localhost:4000/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Refresh-Token": token,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      const result = await response.json();
      // Update local storage
      const currentUser = authServices.getAuthUser();
      const updatedUser = { ...currentUser, ...result.user };
      localStorage.setItem(
        appConfig.CURRENT_USER_KEY,
        JSON.stringify(updatedUser)
      );

      toast.success("Profile updated successfully");
      setUser(updatedUser);
    } catch (error) {
      toast.error(error.message || "Error updating profile");
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      setChangingPassword(true);
      const token = authServices.getRefreshToken();

      const response = await fetch("http://localhost:4000/api/user/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Refresh-Token": token,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update password");
      }

      alert("Password updated successfully");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error(error.message || "Error updating password");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div
      className="p-4 pl-20 mx-10 mt-2 
    "
    >
      <Typography
        variant="h5"
        className="mb-4 text-gray-500 font-medium tracking-wide "
      >
        My Profile
      </Typography>

      <div className="flex flex-col md:flex-row gap-6 mt-4">
        {/* Profile Information */}
        <div className="w-full md:w-1/2">
          <Paper elevation={2} className="p-6 rounded-lg">
            <div className="flex items-center mb-6">
              <Avatar
                src={user.avatar || undefined}
                alt={user.name}
                sx={{ width: 80, height: 80 }}
              >
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </Avatar>
              <div className="ml-4">
                <Typography variant="h6">{user.name}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {user.email}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Member since {new Date(user.createdAt).toLocaleDateString()}
                </Typography>
              </div>
            </div>

            <Divider className="mb-6" />

            <form onSubmit={handleProfileUpdate}>
              <div className="space-y-4">
                <div>
                  <TextField
                    fullWidth
                    label="Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <TextField
                    fullWidth
                    label="Avatar URL"
                    name="avatar"
                    value={formData.avatar}
                    onChange={handleInputChange}
                    placeholder="https://example.com/avatar.jpg"
                    helperText="Enter a URL for your profile image"
                  />
                </div>
                <div>
                  <TextField
                    fullWidth
                    label="Bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    multiline
                    rows={4}
                    placeholder="Tell us about yourself"
                  />
                </div>
                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={updating}
                    startIcon={updating ? <CircularProgress size={20} /> : null}
                  >
                    {updating ? "Updating..." : "Update Profile"}
                  </Button>
                </div>
              </div>
            </form>
          </Paper>
        </div>

        {/* Password Change */}
        <div className="w-full md:w-1/2">
          <Paper elevation={2} className="p-6 rounded-lg">
            <Typography variant="h6" className="mb-4">
              Change Password
            </Typography>

            <form onSubmit={handlePasswordUpdate}>
              <div className="space-y-4">
                <div>
                  <TextField
                    fullWidth
                    label="Current Password"
                    name="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                <div>
                  <TextField
                    fullWidth
                    label="New Password"
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    helperText="Password must be at least 6 characters"
                  />
                </div>
                <div>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    error={
                      passwordData.confirmPassword &&
                      passwordData.newPassword !== passwordData.confirmPassword
                    }
                    helperText={
                      passwordData.confirmPassword &&
                      passwordData.newPassword !== passwordData.confirmPassword
                        ? "Passwords don't match"
                        : ""
                    }
                  />
                </div>
                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="contained"
                    color="secondary"
                    disabled={changingPassword}
                    startIcon={
                      changingPassword ? <CircularProgress size={20} /> : null
                    }
                  >
                    {changingPassword ? "Changing..." : "Change Password"}
                  </Button>
                </div>
              </div>
            </form>
          </Paper>
        </div>
      </div>
    </div>
  );
};
