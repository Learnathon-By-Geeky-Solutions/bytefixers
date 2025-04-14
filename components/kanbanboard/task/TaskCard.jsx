import React from "react";
import deleteIcon from "../../../assets/images/delete.png";
export const TaskCard = ({ key, title, handleDelete, index }) => {
  return (
    <article className="task_card">
      <p className="task_text">{title}</p>
      <div className="task_card_bottom_line">
        <button
          className="task_delete"
          onClick={() => handleDelete(index)}
          aria-label="Delete task"
        >
          <img src={deleteIcon} className="delete_icon" alt="Delete Task" />
        </button>
      </div>
    </article>
  );
};
