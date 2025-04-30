import React from "react";
import deleteIcon from "../../../assets/images/delete.png";
import PropTypes from "prop-types";
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
TaskCard.propTypes = {
  key: PropTypes.string,
  title: PropTypes.string.isRequired,
  handleDelete: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
};
