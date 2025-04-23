import React from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Avatar,
  Tooltip,
  Delete,
} from "../../../common/icons";
import { authServices } from "../../../auth";
import { useNavigate, useResolvedPath } from "react-router-dom";
import { useMembers } from "../../../context/MembersContext";
// Replace this with the logged-in user's ID

export const ProjectTable = () => {
  const navigate = useNavigate();
  const basePath = useResolvedPath("").pathname;
  const { projects, setProjects } = useMembers();
  // const [projects, setProjects] = useState([]);
  const currentUser = authServices.getAuthUser(); // Retrieve stored user data
  const userId = currentUser ? currentUser._id : null; // Extract user ID // Extract the logged-in user ID
  const handleDelete = async (projectId) => {
    try {
      await axios.delete(`http://localhost:4000/projects/${projectId}`);
      setProjects(projects.filter((project) => project._id !== projectId));
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };
  const handlenameClick = (projectid) => {
    navigate(`${basePath}/${projectid}`); // Redirect to project details page
  };

  return (
    <div className="flex items-center pl-40 pt-20">
      <TableContainer component={Paper} className="mt-6 shadow-md">
        <Table>
          <TableHead className="bg-gray-100">
            <TableRow>
              <TableCell
                className="font-bold px-4 py-2 ml-20"
                style={{ textAlign: "center" }}
              >
                ⭐ Name
              </TableCell>
              <TableCell
                className="font-bold text-center px-4 py-2"
                style={{ textAlign: "center" }}
              >
                Key
              </TableCell>
              <TableCell
                className="font-bold text-center px-4 py-2"
                style={{ textAlign: "center" }}
              >
                Type
              </TableCell>
              <TableCell
                className="font-bold text-center px-4 py-2"
                style={{ textAlign: "center" }}
              >
                Lead
              </TableCell>
              <TableCell
                className="font-bold text-center px-4 py-2"
                style={{ textAlign: "center" }}
              >
                Project URL
              </TableCell>
              <TableCell className="font-bold text-center px-4 py-2">
                More Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {projects.map((project) => (
              <TableRow key={project._id} className="hover:bg-gray-50">
                {/* Project Name & Icon */}
                <TableCell className="text-center">
                  <div className="flex justufy-center items-center space-x-2">
                    <Avatar className="bg-gray-200">📁</Avatar>
                    <span
                      className="font-poppins text-blue-500 font-bold cursor-pointer"
                      onClick={() => {
                        handlenameClick(project._id);
                      }}
                    >
                      {project.name}
                    </span>
                  </div>
                </TableCell>

                {/* Key */}
                <TableCell style={{ textAlign: "center" }}>
                  <span className="font-poppins font-bold">
                    {project.name.substring(0, 4).toUpperCase()}
                  </span>
                </TableCell>

                {/* Type */}
                <TableCell>Team-managed software</TableCell>

                {/* Lead */}
                <TableCell style={{ textAlign: "center" }}>
                  <div className="flex items-center space-x-2">
                    <Avatar className="bg-blue-500">
                      {project.createdBy?.name?.substring(0, 2).toUpperCase()}
                    </Avatar>
                    <span className="font-poppins font-semibold text-black">
                      {project?.createdBy?.name}
                    </span>
                  </div>
                </TableCell>

                {/* Project URL (Placeholder) */}
                <TableCell style={{ textAlign: "center" }}>
                  <a href="#" className="font-poppins text-blue-500 font-bold">
                    View
                  </a>
                </TableCell>

                {/* Actions (Delete if created by me) */}
                <TableCell style={{ textAlign: "center" }}>
                  {project?.createdBy === userId ? (
                    <Tooltip title="Delete Project">
                      <IconButton
                        onClick={() => {
                          handleDelete?.(project._id); // Ensure function exists
                        }}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <></>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};
