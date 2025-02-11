require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
app.use(bodyParser.json());
const cors = require("cors");
const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:4000',
        methods: ['GET', 'POST', 'PUT']
    }
});
app.use(cors());
connectDB();
app.use("/api/user", userRoutes);
app.use('/projects', projectRoutes);
app.use('/tasks', taskRoutes);

// Socket.IO for real-time collaboration
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('taskUpdated', ({ projectId, updatedTask }) => {
      io.emit(`project:${projectId}:update`, updatedTask);  // Broadcast updates to clients
  });

  socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
  });
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

app.get("/", (req, res) => {
  res.json({ message: "welcome to our app" });
});
