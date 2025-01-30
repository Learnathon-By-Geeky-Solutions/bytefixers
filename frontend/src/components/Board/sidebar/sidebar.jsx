import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  DashboardIcon,
  AssignmentIcon,
  CalendarTodayIcon,
  FolderIcon,
  PeopleIcon,
  NotificationsIcon,
  PersonIcon,
  Task,
  amber,
} from "../../../common/icons";

const Sidebar = () => {
  const menuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon sx={{ fontSize: "1rem", color: amber[50] }} />,
    },
    {
      text: "Projects",
      icon: <AssignmentIcon sx={{ fontSize: "1rem", color: amber[50] }} />,
    },
    {
      text: "Tasks",
      icon: <Task sx={{ fontSize: "1rem", color: amber[50] }} />,
    },
    {
      text: "Calendar",
      icon: <CalendarTodayIcon sx={{ fontSize: "1rem", color: amber[50] }} />,
    },
    {
      text: "Files",
      icon: <FolderIcon sx={{ fontSize: "1rem", color: amber[50] }} />,
    },
    {
      text: "Team Members",
      icon: <PeopleIcon sx={{ fontSize: "1rem", color: amber[50] }} />,
    },
    {
      text: "Notifications",
      icon: <NotificationsIcon sx={{ fontSize: "1rem", color: amber[50] }} />,
    },
    {
      text: "My Profile",
      icon: <PersonIcon sx={{ fontSize: "1rem", color: amber[50] }} />,
    },
  ];

  return (
    <Drawer
      variant="permanent"
      className="w-40"
      sx={{
        "& .MuiDrawer-paper": { width: "180px", backgroundColor: "black" },
      }}
    >
      <div className="flex flex-col h-screen bg-black text-white">
        <h1 className="text-lg font-bold mb-3 p-4">Project OS</h1>
        <Button
          variant="contained"
          sx={{ fontSize: "0.8rem", marginLeft: "15px", marginRight: "15px" }}
          className="bg-blue-500 text-white m-2 text-xs"
        >
          CREATE NEW
        </Button>
        <List>
          {menuItems.map((item, index) => (
            <ListItem
              key={index}
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
              />
            </ListItem>
          ))}
        </List>
      </div>
    </Drawer>
  );
};

export default Sidebar;
