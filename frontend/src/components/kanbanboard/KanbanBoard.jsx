import React from "react";
import Sidebar from "../Board/sidebar/sidebar";
import TopNavbar from "../Board/navbar/navbar";
import { TaskColoumn } from "./task";

export const KanbanBoard = () => {
  return (
    <div>
      KanbanBoard
      <div
        className="flex justify-center
      "
      >
        <div className="left">
          <Sidebar />
        </div>
        <div className="right">
          <TopNavbar />
          <TaskColoumn />
        </div>
      </div>
    </div>
  );
};
