# ByteFixers

A modern, full-featured project management tool for teams to collaborate, track tasks, manage projects, and communicate efficiently.

---

## 🚀 Features

- **User Authentication** (JWT-based)
- **Project & Task Management** (CRUD, priorities, status, subtasks)
- **Team Collaboration** (teams, member assignment)
- **File Upload & Management** (Cloudinary integration)
- **Notifications** (real-time, per user)
- **Calendar & Scheduling**
- **Chat System**
- **Activity Logging**
- **Responsive UI** (React, Material UI, TailwindCSS)
- **API-first Design** (RESTful endpoints)
- **CI/CD** (GitHub Actions)
- **Testing** (Jest)

---

## 🏗️ Tech Stack

- **Frontend:** React, Material UI, TailwindCSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
- **Authentication:** JWT
- **File Storage:** Cloudinary
- **Email:** Nodemailer (Gmail)
- **AI Integration:** Gemini API
- **Testing:** Jest
- **CI/CD:** GitHub Actions

---

## 👥 Team

- **Habiba Rafique** -> **(HABIBARAFIQ)** (Team Leader)
- **Ekramul Haque Amin** -> **(Amin-2005022)**
- **Tamim Hasan Saad** -> **(Tamim-saad)**

**Mentor: Moshiuzzaman Shozon Raj**

---

## 📦 Getting Started

### Prerequisites

- Node.js (v16+)
- npm (v8+)
- MongoDB (v6+)
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Learnathon-By-Geeky-Solutions/bytefixers.git
cd bytefixers
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env # Edit with your credentials
npm install
npm run dev
```
- See [docs/setup.md](docs/setup.md) for environment variables.

### 3. Frontend Setup

```bash
cd ../frontend
cp .env.example .env # Edit with your backend URL
npm install
npm run dev
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:4000](http://localhost:4000)

---

## 🧪 Testing

- **Backend:**  
  ```bash
  cd backend && npm test
  ```
- **Frontend:**  
  ```bash
  cd frontend && npm test
  ```

---

## 📝 Development Guidelines

1. Create feature branches
2. Make small, focused commits
3. Write descriptive commit messages
4. Create pull requests for review
5. Follow [Contributing Guidelines](CONTRIBUTING.md)

---

## 📡 API Overview

- User: `/api/user/*`
- Projects: `/projects/*`
- Tasks: `/tasks/*`
- Teams: `/teams/*`
- Files: `/files/*`
- Notifications: `/api/notifications/*`
- Calendar: `/api/calendar/*`
- Chat: `/api/chat/*`

See [API Documentation](docs/documentation.md#api-documentation) for full details.

---

## 🗄️ Database Models

- User, Project, Task, Subtask, Team, Notification, Attachment  
  See [docs/documentation.md#database-models](docs/documentation.md#database-models)

---

## ☁️ Services Setup

- **Cloudinary:** For file uploads ([setup](docs/setup.md#cloudinary-setup))
- **Gmail:** For email notifications ([setup](docs/setup.md#email-configuration-gmail))
- **Gemini API:** For AI features ([setup](docs/setup.md#gemini-api-setup-ai-chatbot))

---

## 📚 Documentation & Resources

- [UI Figma Design](https://www.figma.com/design/Up4Tppn2Zn5hMDaaXqWHox/Untitled?node-id=0-1&m=dev&t=MPJc5E4z9Nrk1n3Z-1/)
- [Project Documentation](docs/documentation.md)
- [Development Setup Guide](docs/setup.md)
- [Tech Stack Overview](docs/teck_stack.pdf)

---