import React, { useMemo } from "react";
import {
  CircularProgress,
  Card,
  CardContent,
  Typography,
} from "../../../common/icons";
import { useMembers } from "../../../context/MembersContext";
import { Link } from "react-router-dom";

export const RecentProjectShow = () => {
  const { members, projects, loading } = useMembers();

  // Get the most recent projects (last 2)
  const recentProjects = projects?.slice(-3) || [];

  // Create a lookup map for members
  const membersMap = useMemo(() => {
    const map = {};
    if (members && Array.isArray(members)) {
      members.forEach((member) => {
        if (member && member._id) {
          map[member._id] = member;
        }
      });
    }
    return map;
  }, [members]);

  // Get full member details for a project
  const getProjectMembers = (project) => {
    if (!project || !project.members) return [];

    return project.members.map((memberId) => {
      // If member is already an object with details
      if (typeof memberId === "object" && memberId !== null) {
        return memberId;
      }

      // Otherwise, look up the member in our membersMap
      const memberDetails = membersMap[memberId];
      return (
        memberDetails || {
          _id: memberId,
          name: "Unknown User",
          avatar: null,
        }
      );
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      {/* Reduced padding from p-6 to p-4 */}
      <h1 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
        {/* Reduced text size and margin */}
        <span className="bg-blue-500 w-1 h-5 rounded-md mr-2"></span>
        {/* Smaller indicator bar */}
        Recent Projects
      </h1>

      {loading ? (
        <div className="flex flex-col justify-center items-center h-16">
          {/* Reduced height from h-25 to h-16 */}
          <CircularProgress color="primary" size={24} />
          {/* Smaller loading spinner */}
        </div>
      ) : recentProjects.length === 0 ? (
        <div className="flex items-center justify-center h-24 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          {/* Reduced height from h-52 to h-24 */}
          <svg
            className="w-8 h-8 text-gray-400 mb-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
            ></path>
          </svg>
          <p className="text-gray-500 text-sm">No projects found</p>
          {/* Removed the "Create New Project" link to save space */}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Reduced gap from gap-6 to gap-3 */}
          {recentProjects.map((project) => {
            // Get enriched member data for this project
            const projectMembers = getProjectMembers(project);

            return (
              <Link
                to={`../projects/${project._id}`}
                key={project._id}
                className="hover:no-underline"
              >
                <Card className="h-full transition-all duration-300 hover:shadow-md hover:translate-y-[-2px] cursor-pointer border-l-4 border-blue-500">
                  {/* Changed from border-top to border-left and reduced shadow and transform */}
                  <CardContent className="p-3">
                    {/* Reduced padding from p-5 to p-3 */}
                    <div className="flex justify-between items-start mb-2">
                      {/* Reduced margin */}
                      <Typography
                        variant="subtitle1"
                        className="font-semibold text-gray-800"
                      >
                        {/* Changed from h6 to subtitle1 */}
                        {project.name}
                      </Typography>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          project.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : project.status === "Completed"
                            ? "bg-blue-100 text-blue-800"
                            : project.status === "On Hold"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {/* Reduced padding */}
                        {project.status}
                      </span>
                    </div>

                    <Typography
                      variant="body2"
                      color="textSecondary"
                      className="text-gray-600 mb-2 line-clamp-1 text-xs"
                    >
                      {/* Changed from line-clamp-2 to line-clamp-1 and made text smaller */}
                      {project.description || "No description available"}
                    </Typography>

                    <div className="flex justify-between items-center mt-2">
                      {/* Combined sections and removed borders to save space */}
                      {/* Progress indicator */}
                      {project.progress !== undefined && (
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-blue-500 h-1.5 rounded-full"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {project.progress}%
                          </span>
                        </div>
                      )}

                      {/* Team members */}
                      <div className="flex -space-x-1">
                        {/* Reduced spacing */}
                        {projectMembers.slice(0, 2).map((member) => (
                          <div
                            key={member._id}
                            title={member.name || member.email || "Team member"}
                            className="w-5 h-5 rounded-full bg-gray-300 border border-white flex items-center justify-center text-xs text-gray-600 overflow-hidden"
                          >
                            {/* Smaller avatars */}
                            {member.avatar ? (
                              <img
                                src={member.avatar}
                                alt={member.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-[10px]">
                                {(member.name || member.email || "?")
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>
                            )}
                          </div>
                        ))}

                        {projectMembers.length > 2 && (
                          <div className="w-5 h-5 rounded-full bg-gray-100 border border-white flex items-center justify-center text-[10px] text-gray-600">
                            {/* Smaller text */}+{projectMembers.length - 2}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {!loading && recentProjects.length > 0 && (
        <div className="mt-2 text-center">
          {/* Reduced margin */}
          <Link
            to="../projects"
            className="text-blue-500 hover:text-blue-700 font-medium text-xs inline-flex items-center"
          >
            {/* Smaller text */}
            View All
            <svg
              className="w-3 h-3 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Smaller icon */}
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              ></path>
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
};
