const app = require("./app");
const connectDB = require("./config/db");

if (process.env.NODE_ENV !== "test") {
  connectDB();
  app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
  });
}
