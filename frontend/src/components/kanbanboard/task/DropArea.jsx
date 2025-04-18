import React, { useState } from "react";

export const DropArea = ({ onDrop }) => {
  const [showDropArea, setShowDropArea] = useState(false);
  return (
    <section
      className={`${
        showDropArea
          ? "flex items-center justify-center bg-gray-200 border-5 border-dashed border-gray-400 rounded-lg opacity-100 transition-all duration-200 ease-in-out"
          : "opacity-0 "
      }`}
      onDragEnter={() => setShowDropArea(true)}
      onDragLeave={() => setShowDropArea(false)}
      onDrop={(e) => {
        onDrop();
        setShowDropArea(false);
      }}
      onDragOver={(e) => e.preventDefault()}
    >
      <p className="text-gray-500 text-xl leading-[0.5rem]">Drop here</p>
    </section>
  );
};
