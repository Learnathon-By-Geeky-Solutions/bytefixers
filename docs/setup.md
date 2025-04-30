# 🛠️ Development Setup Guide

This document provides step-by-step instructions for setting up the **ByteFixers** project development environment.

---

## 📋 Prerequisites

Ensure the following are installed on your system:

- **Node.js** (v16.x or newer)
- **npm** (v8.x or newer)
- **MongoDB** (v6.0 or newer)
- **Git**

---

## 📦 Clone the Repository

```bash
git clone https://github.com/Learnathon-By-Geeky-Solutions/bytefixers.git
cd bytefixers
```

---

## 🧩 Backend Setup

### 🔐 Environment Configuration

In the `backend` directory, create a `.env` file with the following variables:

```ini
PORT=4000
MONGODB_URI=your_mongodb_connection_string
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GMAIL_USER=your_email@gmail.com
GMAIL_PASS=your_app_password
GEMINI_API_KEY=your_gemini_api_key
```

### ▶️ Start the Backend Server

```bash
cd backend
npm install
npm run dev
```

The backend server should now be running at: [${process.env.REACT_APP_BASE_URL}](${process.env.REACT_APP_BASE_URL})

---

## 🎨 Frontend Setup

### 🔐 Environment Configuration

In the `frontend` directory, create a `.env` file:

```ini
VITE_BACKEND_URL=${process.env.REACT_APP_BASE_URL}
```

### ▶️ Start the Frontend Server

```bash
cd frontend
npm install
npm run dev
```

The frontend application should now be running at: [http://localhost:3000](http://localhost:3000)

---

## 🗄️ Database Setup

The application uses **MongoDB**.  
Ensure MongoDB is running locally, or update the `MONGODB_URI` in your backend `.env` file to point to your MongoDB instance.

---

## ☁️ Additional Services Setup

### 📷 Cloudinary Setup

1. Create a [Cloudinary](https://cloudinary.com/) account.
2. Retrieve your **Cloud name**, **API key**, and **API secret**.
3. Add them to the backend `.env` file.

---

### 📧 Email Configuration (Gmail)

1. Use a Gmail account for testing.
2. Enable 2-Factor Authentication.
3. Generate an **App Password** from your Google Account settings.
4. Use this App Password in your backend `.env` file.

---

### 🤖 Gemini API Setup (AI Chatbot)

1. Create a [Google Cloud](https://cloud.google.com/) account and enable Gemini API.
2. Generate an API key.
3. Add it to your backend `.env` file as `GEMINI_API_KEY`.

---

## 🚀 Development Workflow

```bash
# Create a new feature branch
git checkout -b feature/your-feature-name

# Make your changes and commit
git add .
git commit -m "Describe your changes"

# Push to remote
git push origin feature/your-feature-name
```

Then, open a Pull Request on GitHub.

---

## ✅ Testing

- **Backend:**  
  ```bash
  cd backend && npm test
  ```
- **Frontend:**  
  ```bash
  cd frontend && npm test
  ```
  (if tests are configured)

---

## 🧰 Troubleshooting

- **Backend connection issues:** Check if MongoDB is running and the URI is correct.
- **File upload errors:** Verify your Cloudinary credentials.
- **Email sending fails:** Recheck your Gmail App Password and ensure it’s correct.