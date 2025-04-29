require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const app = express();

// Disable X-Powered-By header
app.disable('x-powered-by');

const bodyParser = require("body-parser");
const connectDB = require("./config/db");
const multer = require("multer");
const cors = require("cors");

// More secure CORS configuration
const corsOptions = {
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  hideOptionsCall: true,
};

// Security middlewares
app.use(helmet());
app.use(cors(corsOptions));

app.use(bodyParser.json());

connectDB();

// Route imports and mounting
const userRoutes = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const sendEmailRoutes = require("./routes/sendEmailRoutes");
const teamRoutes = require("./routes/teamRoutes");
const fileRoutes = require("./routes/fileRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const calendarRoutes = require("./routes/calendarRoutes");
const chatRoutes = require("./routes/chatRoutes");
app.use("/api/chat", chatRoutes);
app.use("/api/user", userRoutes);
app.use("/projects", projectRoutes);
app.use("/tasks", taskRoutes);
app.use("/sendEmail", sendEmailRoutes);
app.use("/teams", teamRoutes);
app.use("/files", fileRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/calendar", calendarRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

app.get("/", (req, res) => {
  res.json({ message: "welcome to our app" });
});