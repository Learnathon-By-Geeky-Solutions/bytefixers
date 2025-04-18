import React from "react";

export const SubtaskProgress = ({ subtasks }) => {
  // Calculate progress
  const totalSubtasks = subtasks.length;
  const completedSubtasks = subtasks.filter(
    (task) => task.status === "DONE"
  ).length;
  const progressPercentage =
    totalSubtasks > 0
      ? Math.round((completedSubtasks / totalSubtasks) * 100)
      : 0;

  // Determine progress color
  let progressColor = "bg-blue-500"; // Default
  if (progressPercentage === 100) {
    progressColor = "bg-green-500";
  } else if (progressPercentage >= 50) {
    progressColor = "bg-yellow-500";
  }

  return (
    <div className="mt-2">
      <div className="flex justify-between items-center text-xs mb-1">
        <span className="text-gray-500">Progress: {progressPercentage}%</span>
        <span className="text-gray-500">
          {completedSubtasks}/{totalSubtasks} complete
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${progressColor} h-2 rounded-full`}
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
    </div>
  );
};
