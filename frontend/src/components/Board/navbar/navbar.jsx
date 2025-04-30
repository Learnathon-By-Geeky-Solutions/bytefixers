import {
  Help,
  AccountCircle,
  Add,
  Share,
  Search,
  Input,
  Button,
} from "../../../common/icons";
import { useNavigate, useParams } from "react-router-dom";
import { navItems } from "./navmenu";
import { InviteModal } from "../../../common/inviteModal";
import { TaskColoumn, TaskCreate } from "../../kanbanboard/task";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useMembers } from "../../../context/MembersContext";
import { NotificationBell } from "../../notification/NotificationBell";
import { authServices } from "../../../auth";
import { useNotifications } from "../../../context/NotificationContext";
const TopNavbar = () => {
  const { members: projectMembers } = useMembers();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const { projectid } = useParams();
  const [name, setName] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const currentUser = authServices.getAuthUser();
  const { addNotification } = useNotifications();
  // Handle Task Creation
  const handleCreateTask = (newTask) => {
    const currentTasks = Array.isArray(tasks) ? [...tasks] : [];
    if (newTask) {
      if (Array.isArray(newTask)) {
        setTasks([...currentTasks, ...newTask]);
      } else {
        setTasks([...currentTasks, newTask]);
      }
    } // Add new task to the list
    setRefreshTrigger((prev) => prev + 1);
    addNotification({
      type: "task",
      message: `New task **${newTask.title}** created in **${newTask.status}**`,
      projectId: projectid,
      taskId: newTask._id,
      isImportant: newTask.priority === "HIGH",
      createdBy: currentUser?._id,
      recipients: projectMembers?.map((member) => member._id).filter(Boolean),
      timestamp: new Date().toISOString(),
    });
  };
  useEffect(() => {
    // finding the project name from the project id
    axios.get(`${process.env.REACT_APP_BASE_URL}/projects/${projectid}`).then((res) => {
      setName(res.data.name);
    });
    fetchAllTasks();
  }, [projectid]);
  const fetchAllTasks = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/projects/${projectid}/tasks`
      );
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };
  // Search function
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === "") {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);

    // Search logic
    let tasksToSearch = [];

    Object.keys(tasks).forEach((key) => {
      if (Array.isArray(tasks[key])) {
        tasksToSearch = tasksToSearch.concat(tasks[key]);
      } else if (typeof tasks[key] === "object" && tasks[key] !== null) {
        tasksToSearch.push(tasks[key]);
      }
    });
    const filtered = tasksToSearch.filter((task) => {
      const titleMatch = task.title
        ?.toLowerCase()
        .includes(query.toLowerCase());

      const descriptionMatch = task.description
        ?.toLowerCase()
        .includes(query.toLowerCase());

      const tagMatch = task.tags?.some((tag) =>
        tag.toLowerCase().includes(query.toLowerCase())
      );

      return titleMatch || descriptionMatch || tagMatch;
    });

    setSearchResults(filtered);
    setIsSearching(false);
  };

  // Navigate to task
  const goToTask = (taskId) => {
    navigate(`/project/${projectid}/task/${taskId}`, { replace: true });
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const handleListItemClick = (route) => {
    if (route !== "calendar") {
      navigate(`/kanbanBoard/${route}/projects/${projectid}`);
    } else {
      navigate(`/kanbanBoard/project/${projectid}/${route}`);
    }
  };
  const handleSearchKeyDown = (e) => {
    // Clear search on Escape key
    if (e.key === "Escape") {
      setSearchQuery("");
      setSearchResults([]);
      setShowResults(false);
    }
  };
  const handleProfileClick = () => {
    setProfileMenuOpen((prev) => !prev);
  };

  const handleMyAccountClick = () => {
    navigate(`/kanbanBoard/profile`, { replace: true });
    setProfileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      // Clear local storage
      authServices.logout();

      // Redirect to login page
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  // Function to choose color based on priority
  const chooseColor = (priority) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  return (
    <div className="flex flex-col pl-28">
      {/* Main Navbar */}
      <div className="flex h-14 items-center px-4 gap-60 border-b">
        <div
          className="flex items-center gap-2 flex-1 relative"
          ref={searchRef}
        >
          <Search className="h-4 w-4 text-muted-foreground absolute left-3" />
          <Input
            type="search"
            placeholder="Search tasks by title, description or tags..."
            className="h-9 md:w-[300px] lg:w-[400px] border-none pl-9 pr-3"
            value={searchQuery}
            onChange={handleSearch}
            onKeyDown={handleSearchKeyDown}
            onFocus={() => {
              if (searchQuery.trim() !== "") {
                setShowResults(true);
              }
            }}
          />
          {/* Search Results Dropdown */}
          {showResults && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white shadow-lg rounded-md overflow-hidden z-50 max-h-64 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  Searching...
                </div>
              ) : (
                (() => {
                  if (searchResults.length > 0) {
                    return (
                      <ul>
                        {searchResults.map((task) => (
                          <button
                            key={task._id}
                            onClick={() => goToTask(task._id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                goToTask(task._id);
                              }
                            }}
                            className="w-full p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                          >
                            <div className="flex items-center justify-between">
                              {/* <div className="flex-1"> */}
                              <div className="text-left">
                                <p className="font-medium">{task.title}</p>
                                <p className="text-sm text-gray-600 truncate">
                                  {task.description || "No description"}
                                </p>
                              </div>
                              {task.tags && task.tags.length > 0 && (
                                <div className="flex mt-1 flex-wrap gap-1">
                                  {task.tags.slice(0, 3).map((tag) => (
                                    <span
                                      key={tag._id}
                                      className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                  {task.tags.length > 3 && (
                                    <span className="text-xs text-gray-500">
                                      +{task.tags.length - 3} more
                                    </span>
                                  )}
                                </div>
                              )}
                              {/* </div> */}
                              <span
                                className={`px-2 py-0.5 rounded text-xs ${chooseColor(
                                  task.priority
                                )}`}
                                // className={`px-2 py-0.5 rounded text-xs ${
                                //   task.priority === "HIGH"
                                //     ? "bg-red-100 text-red-800"
                                //     : task.priority === "MEDIUM"
                                //     ? "bg-yellow-100 text-yellow-800"
                                //     : "bg-green-100 text-green-800"
                                // }
                                // `}
                              >
                                {task.priority || "MEDIUM"}
                              </span>
                            </div>
                          </button>
                        ))}
                      </ul>
                    );
                  } else {
                    return (
                      <div className="p-4 text-center text-sm text-gray-500">
                        No tasks found matching "{searchQuery}"
                      </div>
                    );
                  }
                })()
              )}

              {/* Search tips footer */}
              <div className="px-3 py-2 text-xs text-gray-500 border-t bg-gray-50">
                Press ESC to clear search • Click on a result to navigate
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="contained"
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setModalOpen(true)}
          >
            <Add className="h-4 w-4 mr-1" />
            Create
          </Button>
          <NotificationBell></NotificationBell>
          <Button variant="ghost" size="icon">
            <Help className="h-4 w-4" />
          </Button>
          <div className="relative" ref={profileMenuRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleProfileClick}
              className="relative"
            >
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <AccountCircle className="h-5 w-5" />
              )}
            </Button>

            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg overflow-hidden z-50">
                <div className="p-4 border-b">
                  <div className="flex items-center">
                    <div className="mr-3">
                      {currentUser?.avatar ? (
                        <img
                          src={currentUser.avatar}
                          alt={currentUser.name}
                          className="h-12 w-12 rounded-full"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-lg">
                          {currentUser?.name?.charAt(0) || "U"}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">
                        {currentUser?.name || "User"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {currentUser?.email || ""}
                      </div>
                    </div>
                  </div>

                  {currentUser?.bio && (
                    <div className="mt-2 text-sm text-gray-600 line-clamp-2">
                      {currentUser.bio}
                    </div>
                  )}
                </div>

                <div className="py-1">
                  <button
                    onClick={handleMyAccountClick}
                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center w-full text-left"
                  >
                    <div className="h-4 w-4 mr-2" />
                    My Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center w-full text-left"
                  >
                    <div className="h-4 w-4 mr-2" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Project Header */}
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">{name}</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Share className="h-4 w-4 mr-1" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex items-center px-4 h-10 gap-6 text-sm border-b">
        {navItems.map((item) => (
          <button
            key={item._id}
            className={`flex items-center gap-2 ${item.className} cursor-pointer`}
            onClick={() => handleListItemClick(item.path)}
          >
            {item.icon}
            {item.name}
          </button>
        ))}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto"
          onClick={() => setInviteModalOpen(true)}
        >
          <Add className="h-4 w-4" />
        </Button>
      </div>
      <TaskColoumn projectId={projectid} key={`taskcolumn-${refreshTrigger}`} />
      <TaskCreate
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreateTask}
        projectid={projectid}
      />
      <InviteModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        projectid={projectid}
      />
    </div>
  );
};

export default TopNavbar;
