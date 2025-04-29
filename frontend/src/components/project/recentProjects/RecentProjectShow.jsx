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
        if (member?._id) {
          map[member._id] = member;
        }
      });
    }
    return map;
  }, [members]);

  // Get full member details for a project
  const getProjectMembers = (project) => {
    return (
      project?.members?.map((memberId) => {
        // If member is already an object with details
        if (typeof memberId === "object" && memberId !== null) {
          return memberId;
        }

        // Otherwise, look up the member in our membersMap
        return (
          membersMap[memberId] || {
            _id: memberId,
            name: "Unknown User",
            avatar: null,
          }
        );
      }) || []
    );
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Completed":
        return "bg-blue-100 text-blue-800";
      case "On Hold":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Handle loading, empty projects, and displaying projects
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col justify-center items-center h-16">
          <CircularProgress color="primary" size={24} />
        </div>
      );
    }

    if (recentProjects.length === 0) {
      return (
        <div className="flex items-center justify-center h-24 bg-gray-50 rounded-lg border border-dashed border-gray-300">
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
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {recentProjects.map((project) => {
          const projectMembers = getProjectMembers(project);
          return (
            <Link
              to={`../projects/${project._id}`}
              key={project._id}
              className="hover:no-underline"
            >
              <Card className="h-full transition-all duration-300 hover:shadow-md hover:translate-y-[-2px] cursor-pointer border-l-4 border-blue-500">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <Typography
                      variant="subtitle1"
                      className="font-semibold text-gray-800"
                    >
                      {project.name}
                    </Typography>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${getStatusClass(
                        project.status
                      )}`}
                    >
                      {project.status}
                    </span>
                  </div>

                  <Typography
                    variant="body2"
                    color="textSecondary"
                    className="text-gray-600 mb-2 line-clamp-1 text-xs"
                  >
                    {project.description || "No description available"}
                  </Typography>

                  <div className="flex justify-between items-center mt-2">
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

                    <div className="flex -space-x-1">
                      {projectMembers.slice(0, 2).map((member) => (
                        <div
                          key={member._id}
                          title={member.name || member.email || "Team member"}
                          className="w-5 h-5 rounded-full bg-gray-300 border border-white flex items-center justify-center text-xs text-gray-600 overflow-hidden"
                        >
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
                          +{projectMembers.length - 2}
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
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h1 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
        <span className="bg-blue-500 w-1 h-5 rounded-md mr-2" /> Recent Projects
      </h1>

      {renderContent()}

      {!loading && recentProjects.length > 0 && (
        <div className="mt-2 text-center">
          <Link
            to="../projects"
            className="text-blue-500 hover:text-blue-700 font-medium text-xs inline-flex items-center"
          >
            View All
            <svg
              className="w-3 h-3 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
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
