import React from "react";
import { Button } from "../../../common/icons";
import { useState } from "react";
import { RecentProjectShow } from "./RecentProjectShow";
import { ProjectModal } from "./ProjectModal";
export const ProjectCreate = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  return (
    <div className="bg-gray-50 rounded-lg shadow p-4 w-full">
      <div className="flex justify-between items-start">
        {/* Make RecentProjectShow take up most of the width */}
        <div className="flex-1">
          <RecentProjectShow />
        </div>
        {/* Plus Button to Open Modal */}
        <div className="pl-4 pt-2 flex-shrink-0">
          <Button
            onClick={() => setModalOpen(true)}
            variant="contained"
            sx={{
              backgroundColor: "primary",
              "&:hover": { backgroundColor: "lightblue" },
              width: "50px",
              height: "50px",
              minWidth: "50px",
              fontSize: "20px",
              borderRadius: "10px",
            }}
          >
            +
          </Button>
        </div>
      </div>

      {/* Project Creation Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onRequestClose={() => setModalOpen(false)}
      />
    </div>
  );
};
