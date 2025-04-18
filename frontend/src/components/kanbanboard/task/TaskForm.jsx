import React, { useState } from "react";
import { TaskColoumn } from "./TaskColoumn";

export const TaskForm = ({ handleAddTask }) => {
  const [taskData, setTaskData] = useState({
    task: "",
    status: "todo",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setTaskData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleAddTask(taskData);
    setTaskData({ task: "", status: "todo" });
  };

  return (
    <div>
      <h2>Task Form</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="task"
          value={taskData.task}
          className="task_input"
          placeholder="Enter your task"
          onChange={handleChange}
        />
        <select
          name="status"
          value={taskData.status}
          className="task_status"
          onChange={handleChange}
        >
          <option value="todo">To Do</option>
          <option value="inProgress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <button type="submit" className="task_submit">
          + Add Task
        </button>
      </form>
      <TaskColoumn />
    </div>
  );
};
