require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
app.disable("x-powered-by");

const corsOptions = {
  origin: "https://bytefixers-frontend.vercel.app",
  methods: ["GET", "POST", "PUT", "DELETE"],
  hideOptionsCall: true,
  optiosSuccessStatus: 200
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(bodyParser.json());

// Route imports
const userRoutes = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const sendEmailRoutes = require("./routes/sendEmailRoutes");
const teamRoutes = require("./routes/teamRoutes");
const fileRoutes = require("./routes/fileRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const calendarRoutes = require("./routes/calendarRoutes");
const chatRoutes = require("./routes/chatRoutes");
const authRoutes = require("./routes/authRoutes");
// Mount routes
app.use("/api/chat", chatRoutes);
app.use("/api/user", userRoutes);
app.use("/projects", projectRoutes);
app.use("/tasks", taskRoutes);
app.use("/sendEmail", sendEmailRoutes);
app.use("/teams", teamRoutes);
app.use("/files", fileRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/auth", authRoutes);
app.get("/", (req, res) => {
  res.json({ message: "Welcome to our app" });
});

module.exports = app;
