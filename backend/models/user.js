const mongoose = require("mongoose");
const todoList = require("./todoList");
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    todoList: [
      {
        type: mongoose.Types.ObjectId,
        ref: "TodoList",
      },
    ],
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("User", UserSchema);
