import React from "react";
import login_signupPicture from "../../assets/images/login_signupPicture.jpg";
import { useNavigate } from "react-router-dom";
const AppBar = () => {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate("/signup");
  };
  return (
    <div className="bg-blue-50 min-h-screen">
      {/* Navbar */}
      <header className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-600">ByteFixers</div>
          <nav className="hidden md:flex space-x-6 text-gray-700 font-medium">
            <a href="#home" className="hover:text-blue-500">
              Home
            </a>
            <a href="#about" className="hover:text-blue-500">
              About Us
            </a>
            <a href="#services" className="hover:text-blue-500">
              Services
            </a>
            <a href="#contact" className="hover:text-blue-500">
              Contact Us
            </a>
          </nav>
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            onClick={handleClick}
            to="/signup"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center container mx-auto px-6 py-20">
        {/* Left Content */}
        <div className="md:w-1/2 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-bold text-blue-700 leading-tight">
            Advance Project <br />
            <span className="text-blue-500">Management Tool</span>
          </h1>
          <p className="text-gray-600 text-lg mt-4">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
          <button className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            Learn More
          </button>
        </div>

        {/* Right Illustration */}
        <div className="md:w-1/2 mt-10 md:mt-0">
          <img
            src={login_signupPicture} // Replace with your image link
            alt="Landing Illustration"
            className="w-full"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-6">
        <div className="container mx-auto px-6 flex justify-center space-x-6">
          <a href="#!" className="text-gray-600 hover:text-blue-600">
            <i className="fab fa-facebook text-xl"></i>
          </a>
          <a href="#!" className="text-gray-600 hover:text-blue-600">
            <i className="fab fa-twitter text-xl"></i>
          </a>
          <a href="#!" className="text-gray-600 hover:text-blue-600">
            <i className="fab fa-instagram text-xl"></i>
          </a>
        </div>
      </footer>
    </div>
  );
};

export default AppBar;
