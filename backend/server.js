require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const connectDB = require("./config/db");
const multer = require("multer");
const userRoutes = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const sendEmailRoutes = require("./routes/sendEmailRoutes");
const teamRoutes = require("./routes/teamRoutes");
const fileRoutes = require("./routes/fileRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const calendarRoutes = require("./routes/calendarRoutes");
app.use(bodyParser.json());
const cors = require("cors");
const corsOptions = {
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
};
app.use(cors(corsOptions));
connectDB();
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
