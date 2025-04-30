import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Visibility,
  VisibilityOff,
  InputAdornment,
  IconButton,
  TextField,
} from "../../common/icons"; // Ensure these imports are correct
import { authServices } from "../../auth"; // Import authServices
import login_signupPicture from "../../assets/images/login_signupPicture.jpg";
import google from "../../assets/images/google.PNG";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
export const SignupForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    agreeToTerms: false,
  });

  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const projectIdFromQuery = queryParams.get("projectId");
  const [success, setSuccess] = useState(null);

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

  const handleSignup = async (e) => {
    e.preventDefault();
    // Handle signup logic here
    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      projectId: projectIdFromQuery,
      // honeypot: "", // Honeypot field
    };
    authServices
      .signup(payload)
      .then(() => {
        if (projectIdFromQuery) {
          // Add user to project (Backend should handle this logic)
          navigate(
            `/login?email=${formData.email}&projectId=${
              projectIdFromQuery || ""
            }`
          );
        } else {
          navigate("/login");
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to signup");
        alert("Failed to signup");
      });
  };
  const handleGoogleLoginSuccess = async (credentialResponse) => {
    try {
      // Decode the JWT token from Google
      const decodedToken = jwtDecode(credentialResponse.credential);
      console.log("Google login successful:", decodedToken);

      // Send the token to your backend
      const googlePayload = {
        type: "google",
        token: credentialResponse.credential,
        // You can extract these from decoded token if needed
        email: decodedToken.email,
        name: decodedToken.name,
      };

      // Call your auth service
      await authServices.loginWithGoogle(googlePayload);

      // Navigate after successful login
      if (projectIdFromQuery) {
        navigate(`/kanbanBoard/projects/${projectIdFromQuery}`);
      } else {
        navigate("/kanbanBoard");
      }

      setSuccess("Google login successful!");
    } catch (err) {
      console.error("Google login failed:", err);
      setError("Google login failed. Please try again.");
    }
  };

  // Google login error handler
  const handleGoogleLoginError = () => {
    console.error("Google login failed");
    setError("Google login failed. Please try again.");
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
            Get Started Now
          </h2>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <form onSubmit={handleSignup} className="space-y-4">
            <TextField
              label="Name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              fullWidth
              variant="outlined"
              className="bg-white"
              placeholder="Enter your name"
            />
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
            <div className="flex items-center">
              <label
                htmlFor="agreeToTerms"
                className="text-sm text-gray-600 flex items-center cursor-pointer"
              >
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500 focus:ring-2 focus:ring-offset-2"
                />
                <span className="ml-2">I agree to the terms & policy</span>
              </label>
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              onClick={handleSignup}
            >
              Signup
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 mb-4">Or</p>

            {/* Replace the static button with Google OAuth button */}
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleLoginSuccess}
                onError={handleGoogleLoginError}
                useOneTap
                type="standard"
                theme="outline"
                size="large"
                text="signin_with"
                shape="rectangular"
                logo_alignment="left"
              />
            </div>
          </div>

          <p className="text-sm mt-4 text-center text-gray-600">
            Have an account?{" "}
            <a
              href="/login"
              className="text-indigo-600 font-medium hover:underline"
            >
              Sign In
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
