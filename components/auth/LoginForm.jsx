import React, { useEffect, useState } from "react";
import {
  Visibility,
  VisibilityOff,
  InputAdornment,
  IconButton,
  TextField,
} from "../../common/icons"; // Ensure these imports are correct
import { useLocation, useNavigate } from "react-router-dom";
import login_signupPicture from "../../assets/images/login_signupPicture.jpg";
import google from "../../assets/images/google.PNG";
import { authServices } from "../../auth";

export const LoginForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const emailFromQuery = queryParams.get("email") || "";
  const projectIdFromQuery = queryParams.get("projectId");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  useEffect(() => {
    if (emailFromQuery) {
      setFormData((prev) => ({ ...prev, email: emailFromQuery }));
    }
  }, [emailFromQuery]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    // Handle signup logic here
    const payload = {
      type: "email",
      email: formData.email,
      password: formData.password,
    };
    // authServices
    //   .login(payload)
    //   .then(() => navigate("/kanbanBoard"))
    //   .catch(() => alert("Failed to login"));
    authServices
      .login(payload)
      .then(() => {
        if (projectIdFromQuery) {
          // Add user to project (Backend should handle this logic)
          navigate(`/kanbanBoard/projects/${projectIdFromQuery}`);
        } else {
          navigate("/kanbanBoard");
        }
      })
      .catch(() => alert("Failed to login"));
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      {/* <div className="flex flex-col md:flex-row bg-white shadow-lg rounded-lg overflow-hidden w-11/12 md:w-3/4 lg:w-2/3"> */}
      <div className="flex flex-row bg-white shadow-md rounded-lg p-6 w-11/12 md:w-2/3 lg:w-1/2">
        {/* Illustration Section */}
        <div className="hidden md:flex md:w-1/2 md:items-center">
          <img
            src={login_signupPicture}
            alt="Sign Up"
            className="h-auto w-full"
          />
        </div>

        {/* Form Section */}
        <div className="w-full md:w-1/2 p-8">
          <h2 className="text-3xl font-semibold text-gray-800 mb-6">
            Welcome Back!
          </h2>
          <h3 className="text-lg text-gray-600 mb-6">
            Enter your credentials to access your account
          </h3>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          {success && <p className="text-green-500 text-sm mb-4">{success}</p>}

          <form onSubmit={handleLogin} className="space-y-4">
            <TextField
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              fullWidth
              variant="outlined"
              className="bg-white"
              placeholder="Enter your email"
            />
            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              fullWidth
              variant="outlined"
              placeholder="Enter your password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={togglePasswordVisibility} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <button
              type="submit"
              className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              onClick={handleLogin}
            >
              Login
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 mb-4">Or</p>
            <button className="flex items-center justify-center w-full border border-gray-300 py-2 px-4 rounded-md text-gray-700 hover:bg-gray-100">
              <img src={google} alt="Google" className="h-5 w-5 mr-2" />
              Sign in with Google
            </button>
          </div>

          <p className="text-sm mt-4 text-center text-gray-600">
            Don't have an account?{" "}
            <a
              href="/signup"
              className="text-indigo-600 font-medium hover:underline"
            >
              Sign Up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
