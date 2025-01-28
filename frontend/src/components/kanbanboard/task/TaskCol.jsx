import React, { useState } from "react";
import { DropArea } from "./DropArea";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { Card, CardContent, CardHeader } from "@mui/material";
import { Input } from "@mui/material";
import { Button } from "@mui/material";
import { ScrollArea } from "@mui/material";
import Typography from "@mui/material/Typography";
export const TaskCol = ({
  title,
  tasks,
  status,
  handleAddTask,
  handleDelete,
  setActiveTask,
  onDrop,
  icon,
}) => {
  const [taskText, setTaskText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (taskText.trim() !== "") {
      handleAddTask(status, taskText);
      setTaskText("");
    }
  };
  const handleDragStart = (status, index) => {
    // console.log(status);
    setActiveTask({ index, stat: status });
  };
  return (
    <div className=" bg-gradient-to-r from-[rgb(41,115,178)] to-[rgb(235,240,255)] shadow-md p-4 animate-fade-in rounded-xl shadow-lg p-6 transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-2xl cursor-pointer">
      <Card className="bg-card/50 backdrop-blur-sm w-[350px] flex-shrink-0">
        <Typography
          gutterBottom
          variant="h6"
          component="div"
          sx={{
            fontWeight: "bold",
            color: "#333",
            textAlign: "center",
            textTransform: "capitalize",
            letterSpacing: "1px",
            marginTop: "16px",
          }}
          className="text-sm md:text-lg hover:text-blue-500 transition-all"
        >
          {title}
        </Typography>
        <CardContent>
          <form onSubmit={handleSubmit} className="mb-4 flex flex-col">
            <input
              type="text"
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              placeholder={`Add a task to ${title}`}
              className="p-2 border border-gray-300 rounded mb-2"
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Add Task
            </button>
          </form>
          <ul className="space-y-2">
            <DropArea onDrop={() => onDrop(status, 0)}></DropArea>
            {tasks.map((task, index) => (
              <React.Fragment key={index}>
                <article
                  className="task_card cursor-grab"
                  draggable="true"
                  onDragStart={() => handleDragStart(status, index)}
                  onDragEnd={() => setActiveTask({ index: null, status: "" })}
                >
                  <li className="bg-gradient-to-r from-[rgb(5, 54, 97)] to-[rgb(1, 49, 50)] p-4 rounded-lg shadow-md w-full break-words ease-in-out hover:-translate-y-2 hover:shadow-2xl cursor-pointer">
                    {/* Task content with delete button */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between w-full">
                      <span className="text-white font-sm flex-1 break-words overflow-hidden w-full">
                        {task.task}
                      </span>
                      <button
                        onClick={() => handleDelete(status, index)}
                        className="text-red-800 transition-all duration-200"
                      >
                        <i className="fas fa-trash-alt mr"></i>
                      </button>
                    </div>

                    {/* Increased space below the task */}
                    <div className="mt-6 border-t border-gray-300 pt-4 flex gap-8 text-gray-500 text-sm">
                      <div className="flex items-center gap-1">
                        <i
                          class="fas fa-comment text-white"
                          aria-hidden="true"
                        ></i>
                        <span className="font-sm text-white">14</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <i
                          class="fas fa-file text-white"
                          aria-hidden="true"
                        ></i>
                        <span className="font-sm text-white">5</span>
                      </div>
                    </div>
                  </li>
                </article>
                <DropArea onDrop={() => onDrop(status, index + 1)}></DropArea>
              </React.Fragment>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
