Development Setup Guide
This document provides step-by-step instructions for setting up the ByteFixers project development environment.

Prerequisites
Before starting, ensure you have the following installed:

Node.js (v16.x or newer)
npm (v8.x or newer)
MongoDB (v6.0 or newer)
Git
Clone the Repository
Backend Setup
Environment Configuration
Create a .env file in the backend directory with the following variables:

Start the Backend Server
The backend server should now be running on http://localhost:4000.

Frontend Setup
Environment Configuration
Create a .env file in the frontend directory:

Start the Frontend Server
The frontend application should now be running on http://localhost:3000.

Database Setup
The application uses MongoDB. Make sure MongoDB is running locally or update the MONGODB_URI in your backend .env file to point to your MongoDB instance.

Additional Services Setup
Cloudinary Setup
Create a Cloudinary account
Get your cloud name, API key, and API secret from the Dashboard
Add these credentials to your backend .env file
Email Configuration
To use email functionality:

Use a Gmail account for testing
Enable 2-factor authentication on your Gmail account
Generate an App Password from your Google Account settings
Use this App Password in your backend .env file
Gemini API Setup (AI Chatbot)
Create a Google Cloud account and enable the Gemini API
Generate an API key and add it to your backend .env file
Development Workflow
Create a feature branch:

Make your changes and commit:

Push changes to remote:

Create a pull request on GitHub

Testing
Backend Tests
Frontend Tests
Troubleshooting
Backend connection issues: Ensure MongoDB is running and the connection URI is correct
File upload errors: Verify your Cloudinary credentials are correctly configured
Email sending fails: Check your Gmail App Password and make sure it's entered correctly