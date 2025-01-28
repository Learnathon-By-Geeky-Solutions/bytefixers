import React, { useEffect, useState } from "react";
import { TaskCol } from "./TaskCol";
import { DragDropContext } from "react-beautiful-dnd";
import { DropArea } from "./DropArea";
import ToDo from "../../../assets/images/to-do-list.png";
import InProgress from "../../../assets/images/in-progress.png";
import Done from "../../../assets/images/done.png";
export const TaskColoumn = () => {
  const initialData = JSON.parse(localStorage.getItem("tasks")) || {
    todo: [],
    inProgress: [],
    done: [],
  };
  const [taskNo, setTaskNo] = useState(0);

  const [tasks, setTasks] = useState(initialData);
  const [activeTask, setActiveTask] = useState({ index: null, stat: null });

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  const handleAddTask = (status, taskText) => {
    setTasks((prev) => ({
      ...prev,
      [status]: [...prev[status], { task: taskText, status }],
    }));
    setTaskNo(taskNo + 1);
  };

  const handleDeleteTask = (status, taskIndex) => {
    setTasks((prev) => ({
      ...prev,
      [status]: prev[status].filter((_, index) => index !== taskIndex),
    }));
  };
  const onDrop = (Targetstatus, position) => {
    console.log(
      `${activeTask.index} dropped to ${Targetstatus} at ${position + 1}`
    );
    // console.log();
    // if (!activeTask) return;
    // const taskTomove = tasks[status][activeTask.index];
    // console.log(taskTomove.inProgress);
    // const updatedTasks = tasks.filter((task, index) => index !== activeTask);
    // updatedTasks.splice(position, 0, { ...taskTomove, status: status });
    // setTasks(updatedTasks);
    let sourceStatus = activeTask.stat;
    let taskToMove = null;

    // Loop through task lists to find the active task
    for (const [status, taskList] of Object.entries(tasks)) {
      //   console.log(status);
      //   console.log(taskList);
      //   console.log(taskList[activeTask.index]);
      //   console.log(activeTask.stat);
      if (status === activeTask.stat) {
        taskToMove = taskList[activeTask.index];
        console.log(taskToMove);
        break;
      }
      //   if (taskList[activeTask]) {
      //     sourceStatus = status;
      //     taskToMove = taskList[activeTask];
      //     console.log(taskToMove);
      //     //     break;
      //   }
    }
    // console.log(sourceStatus);
    // If no task was found, exit early
    if (sourceStatus === Targetstatus) return;
    if (activeTask.index === null || activeTask.stat === "") return;

    // Remove the task from the source list
    const filteredTasks = Object.fromEntries(
      Object.entries(tasks).map(([status, taskList]) => [
        status,
        taskList.filter((task) => task.status === sourceStatus),
      ])
    );
    console.log(JSON.stringify(filteredTasks));
    console.log(JSON.stringify(tasks));
    //{"todo":[{"task":"adad","status":"todo"}],"inProgress":[{"task":"fwf","status":"inProgress"}],"done":[{"task":"ffFEF","status":"done"}]}
    const updatedSourceList = tasks[sourceStatus].filter(
      (_, idx) => idx !== activeTask.index
    );

    // Create a new target list and insert the task
    const updatedTargetList = [...tasks[Targetstatus]];
    updatedTargetList.splice(position, 0, {
      ...taskToMove,
      status: Targetstatus, // Update the task's status
    });

    // Update the state
    setTasks((prev) => ({
      ...prev,
      [sourceStatus]: updatedSourceList,
      [Targetstatus]: updatedTargetList,
    }));
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Task Manager</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4  animate-fade-in">
        <TaskCol
          title="To Do"
          tasks={tasks.todo}
          status="todo"
          handleAddTask={handleAddTask}
          handleDelete={handleDeleteTask}
          setActiveTask={setActiveTask}
          onDrop={onDrop}
          icon={ToDo}
        />
        <TaskCol
          title="In Progress"
          tasks={tasks.inProgress}
          status="inProgress"
          handleAddTask={handleAddTask}
          handleDelete={handleDeleteTask}
          setActiveTask={setActiveTask}
          onDrop={onDrop}
          icon={InProgress}
        />
        <TaskCol
          title="Done"
          tasks={tasks.done}
          status="done"
          handleAddTask={handleAddTask}
          handleDelete={handleDeleteTask}
          setActiveTask={setActiveTask}
          onDrop={onDrop}
          icon={Done}
        />
      </div>
      {
        <h1>
          {/* <p>Active Task Index: {activeTask.index}</p>
        <p>Active Task Status: {activeTask.stat}</p> */}
          {/* <p>Task No:{taskNo}</p> */}
        </h1>
      }
    </div>
  );
};
