require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const corsOptions = {
  origin: process.env.CORS_ORIGIN.split(","), // Convert CSV string to array
  methods: process.env.CORS_METHODS,
  allowedHeaders: process.env.CORS_HEADERS,
};
const helmet = require("helmet");
app.use(helmet());
app.use(bodyParser.json());
const cors = require("cors");
app.use(cors(corsOptions));
connectDB();
app.use("/api/user", userRoutes);
app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

app.get("/", (req, res) => {
  res.json({ message: "welcome to our app" });
});
