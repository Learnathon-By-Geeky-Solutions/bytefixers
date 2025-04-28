import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  DashboardIcon,
  AssignmentIcon,
  FolderIcon,
  PeopleIcon,
  PersonIcon,
  amber,
} from "../../../common/icons";
import React, { useState } from "react";
import { ProjectModal } from "../../project/recentProjects/ProjectModal";
import { useNavigate, useParams } from "react-router-dom";
const Sidebar = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [isProjectModalOpen, setisProjectModalOpen] = useState(false);
  const handleCloseProjectModal = () => {
    setisProjectModalOpen(false);
  };
  const menuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon sx={{ fontSize: "1rem", color: amber[50] }} />,
      route: "dashboard",
    },
    {
      text: "Projects",
      icon: <AssignmentIcon sx={{ fontSize: "1rem", color: amber[50] }} />,
      route: "projects",
    },
    {
      text: "Files",
      icon: <FolderIcon sx={{ fontSize: "1rem", color: amber[50] }} />,
      route: "files",
    },
    {
      text: "Team Members",
      icon: <PeopleIcon sx={{ fontSize: "1rem", color: amber[50] }} />,
      route: "team-members",
    },
    {
      text: "My Profile",
      icon: <PersonIcon sx={{ fontSize: "1rem", color: amber[50] }} />,
      route: "profile",
    },
  ];
  const handleListItemClick = (route) => {
    if (route !== "tasks" && route !== "notifications") {
      navigate(`/kanbanBoard/${route}`);
    } else if (route === "notifications") {
      navigate(`/project/${route}`);
    } else {
      navigate(`/kanbanBoard/${route}/projects/${projectId}`);
    }
  };

  return (
    <>
      <Drawer
        variant="permanent"
        className="w-24"
        sx={{
          "& .MuiDrawer-paper": { width: "180px", backgroundColor: "black" },
        }}
      >
        <div className="flex flex-col h-screen bg-black text-white">
          <h1 className="text-lg font-bold mb-3 p-4">Project OS</h1>
          <Button
            variant="contained"
            onClick={() => setisProjectModalOpen(true)}
            sx={{ fontSize: "0.8rem", marginLeft: "15px", marginRight: "15px" }}
            className="bg-blue-500 text-white m-2 text-xs"
          >
            CREATE NEW
          </Button>
          <List>
            {menuItems.map((item) => (
              <ListItem
                key={item.text}
                className="rounded-md hover:bg-gray-800 flex items-center justify-center cursor-pointer"
                sx={{ minHeight: "30px" }}
              >
                <ListItemIcon
                  className="text-white-900 flex items-center justify-center"
                  sx={{ minWidth: "30px" }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  className="text-white text-xs"
                  onClick={() => handleListItemClick(item.route)}
                />
              </ListItem>
            ))}
          </List>
        </div>
      </Drawer>
      <ProjectModal
        isOpen={isProjectModalOpen}
        onRequestClose={handleCloseProjectModal}
      />
    </>
  );
};

export default Sidebar;
