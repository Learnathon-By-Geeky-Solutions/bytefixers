import React, { useState, useEffect } from "react";
import { authServices } from "../../auth";
import {
  AudioFile,
  Box,
  Button,
  Chip,
  CircularProgress,
  CloudDownload,
  DeleteIcon,
  NoteAddOutlined,
  ArticleOutlined,
  FormControl,
  IconButton,
  ImageIcon,
  InputLabel,
  MenuItem,
  Paper,
  PictureAsPdfOutlined,
  SearchIcon,
  Select,
  TextField,
  Typography,
  MusicVideoOutlined,
  FolderZipOutlined,
} from "../../common/icons";

export const FilesPage = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [fileTypeFilter, setFileTypeFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [projects, setProjects] = useState([]);
  const [deleteInProgress, setDeleteInProgress] = useState(null);

  const currentUser = authServices.getAuthUser();

  // Fetch all files where user is a member of the project
  useEffect(() => {
    const fetchAllFiles = async () => {
      if (!currentUser?._id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch all files for the current user using the dedicated endpoint
        const response = await fetch(
          `http://localhost:4000/files/user/${currentUser._id}`
        );

        if (!response.ok) {
          throw new Error(`Error fetching files: ${response.statusText}`);
        }

        const data = await response.json();

        setFiles(data);

        // Extract unique projects and file types for filters
        const projectsInfo = getProjectsInfo(data);
        setProjects(projectsInfo);

        // Extract unique file types
      } catch (err) {
        console.error("Error fetching files:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllFiles();
  }, [currentUser?._id]);
  const getProjectsInfo = (data) => {
    const uniqueProjects = [...new Set(data.map((file) => file.projectId))];
    return uniqueProjects.map((projectId) => {
      const fileWithProject = data.find((file) => file.projectId === projectId);
      return {
        id: projectId,
        name: fileWithProject?.projectName || "Unknown Project",
      };
    });
  };
  // Helper function to get file type icon
  const getFileIcon = (fileType) => {
    if (!fileType) return <ArticleOutlined />;

    if (fileType.includes("image"))
      return <ImageIcon style={{ color: "#4da6ff" }} />;
    if (fileType.includes("pdf"))
      return <PictureAsPdfOutlined style={{ color: "#ff5252" }} />;
    if (fileType.includes("word") || fileType.includes("document"))
      return <NoteAddOutlined style={{ color: "#2979ff" }} />;
    if (fileType.includes("audio"))
      return <AudioFile style={{ color: "#7c4dff" }} />;
    if (fileType.includes("video"))
      return <MusicVideoOutlined style={{ color: "#f44336" }} />;
    if (fileType.includes("zip") || fileType.includes("compressed"))
      return <FolderZipOutlined style={{ color: "#ffab00" }} />;

    return <ArticleOutlined style={{ color: "#757575" }} />;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return "0 Bytes";

    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  // Handle file deletion
  const handleDeleteFile = async (file) => {
    if (
      !window.confirm(`Are you sure you want to delete "${file.fileName}"?`)
    ) {
      return;
    }

    try {
      setDeleteInProgress(file._id);

      const response = await fetch(
        `http://localhost:4000/files/${file.taskId}/${file._id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: currentUser?._id }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error deleting file");
      }

      // Remove the file from state to update the UI immediately
      setFiles((files) => files.filter((f) => f._id !== file._id));
    } catch (err) {
      console.error("Error deleting file:", err);
      alert("Failed to delete file: " + err.message);
    } finally {
      setDeleteInProgress(null);
    }
  };

  // Filter and sort files
  const filteredAndSortedFiles = React.useMemo(() => {
    return files
      .filter((file) => {
        // Apply search term filter
        const searchMatch =
          file.fileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          file.taskTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          file.projectName?.toLowerCase().includes(searchTerm.toLowerCase());

        // Apply project filter
        const projectMatch =
          projectFilter === "all" || file.projectId === projectFilter;

        // Apply file type filter
        let typeMatch = true;
        if (fileTypeFilter !== "all") {
          if (fileTypeFilter === "image")
            typeMatch = file.fileType?.includes("image");
          else if (fileTypeFilter === "pdf")
            typeMatch = file.fileType?.includes("pdf");
          else if (fileTypeFilter === "document")
            typeMatch =
              file.fileType?.includes("word") ||
              file.fileType?.includes("document");
          else if (fileTypeFilter === "spreadsheet")
            typeMatch =
              file.fileType?.includes("excel") ||
              file.fileType?.includes("spreadsheet");
          else if (fileTypeFilter === "video")
            typeMatch = file.fileType?.includes("video");
          else if (fileTypeFilter === "audio")
            typeMatch = file.fileType?.includes("audio");
          else if (fileTypeFilter === "archive")
            typeMatch =
              file.fileType?.includes("zip") ||
              file.fileType?.includes("compressed");
          else if (fileTypeFilter === "text")
            typeMatch = file.fileType?.includes("text");
          else if (fileTypeFilter === "other") {
            typeMatch =
              !file.fileType?.includes("image") &&
              !file.fileType?.includes("pdf") &&
              !file.fileType?.includes("word") &&
              !file.fileType?.includes("document") &&
              !file.fileType?.includes("excel") &&
              !file.fileType?.includes("spreadsheet") &&
              !file.fileType?.includes("video") &&
              !file.fileType?.includes("audio") &&
              !file.fileType?.includes("zip") &&
              !file.fileType?.includes("compressed") &&
              !file.fileType?.includes("text");
          }
        }

        return searchMatch && projectMatch && typeMatch;
      })
      .sort((a, b) => {
        // Apply sorting
        if (sortBy === "date") {
          return sortOrder === "asc"
            ? new Date(a.uploadedAt) - new Date(b.uploadedAt)
            : new Date(b.uploadedAt) - new Date(a.uploadedAt);
        } else if (sortBy === "name") {
          return sortOrder === "asc"
            ? a.fileName.localeCompare(b.fileName)
            : b.fileName.localeCompare(a.fileName);
        } else if (sortBy === "size") {
          return sortOrder === "asc"
            ? a.fileSize - b.fileSize
            : b.fileSize - a.fileSize;
        } else if (sortBy === "type") {
          return sortOrder === "asc"
            ? (a.fileType || "").localeCompare(b.fileType || "")
            : (b.fileType || "").localeCompare(a.fileType || "");
        }
        return 0;
      });
  }, [files, searchTerm, sortBy, sortOrder, projectFilter, fileTypeFilter]);

  const handleDownload = async (file) => {
    try {
      if (!file.taskId || !file._id) {
        alert("Cannot download file: Missing task ID or file ID");
        return;
      }

      // Show loading indicator
      setDeleteInProgress(file._id); // Reuse the loading state

      // First, fetch the file through your backend to get the proper content disposition
      const response = await fetch(
        `http://localhost:4000/files/download/${file.taskId}/${file._id}`
      );

      if (!response.ok) {
        throw new Error(`Error downloading file: ${response.statusText}`);
      }

      // Get the file blob
      const blob = await response.blob();

      // Create a blob URL
      const url = window.URL.createObjectURL(blob);

      // Create a download link
      const link = document.createElement("a");
      link.href = url;
      link.download = file.fileName;
      document.body.appendChild(link);

      // Trigger the download
      link.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to download file: " + err.message);
    } finally {
      setDeleteInProgress(null); // Hide loading indicator
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="80vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Paper elevation={3} sx={{ p: 4, m: 4 }}>
        <Typography color="error" variant="h6">
          Error loading files:
        </Typography>
        <Typography>{error}</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={3}
      sx={{ p: 3, m: { xs: 1, sm: 2, md: 3 }, ml: { xs: 24, sm: 24, md: 24 } }}
    >
      <Typography
        variant="h5"
        gutterBottom
        component="div"
        sx={{ mb: 3, fontWeight: "bold" }}
      >
        My Files
      </Typography>

      {/* Filters and Search */}
      <Box sx={{ mb: 3 }}>
        <div className="flex flex-wrap gap-4">
          {/* Search Bar */}
          <div className="w-full md:w-1/3 lg:w-1/4">
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
              <TextField
                fullWidth
                label="Search files"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                variant="outlined"
              />
            </Box>
          </div>

          {/* Project Filter */}
          <div className="w-full sm:w-1/2 md:w-1/5">
            <FormControl fullWidth size="small">
              <InputLabel>Project</InputLabel>
              <Select
                value={projectFilter}
                label="Project"
                onChange={(e) => setProjectFilter(e.target.value)}
              >
                <MenuItem value="all">All Projects</MenuItem>
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          {/* File Type Filter */}
          <div className="w-full sm:w-1/2 md:w-1/5">
            <FormControl fullWidth size="small">
              <InputLabel>File Type</InputLabel>
              <Select
                value={fileTypeFilter}
                label="File Type"
                onChange={(e) => setFileTypeFilter(e.target.value)}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="image">Images</MenuItem>
                <MenuItem value="pdf">PDFs</MenuItem>
                <MenuItem value="document">Documents</MenuItem>
                <MenuItem value="spreadsheet">Spreadsheets</MenuItem>
                <MenuItem value="video">Videos</MenuItem>
                <MenuItem value="audio">Audio</MenuItem>
                <MenuItem value="archive">Archives</MenuItem>
                <MenuItem value="text">Text Files</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </div>

          {/* Sort By */}
          <div className="w-full sm:w-1/2 md:w-1/5">
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="date">Upload Date</MenuItem>
                <MenuItem value="name">File Name</MenuItem>
                <MenuItem value="size">File Size</MenuItem>
                <MenuItem value="type">File Type</MenuItem>
              </Select>
            </FormControl>
          </div>

          {/* Sort Order */}
          <div className="w-full sm:w-1/2 md:w-1/5">
            <FormControl fullWidth size="small">
              <InputLabel>Order</InputLabel>
              <Select
                value={sortOrder}
                label="Order"
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <MenuItem value="desc">Descending</MenuItem>
                <MenuItem value="asc">Ascending</MenuItem>
              </Select>
            </FormControl>
          </div>
        </div>
      </Box>

      {/* Results count */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {filteredAndSortedFiles.length}{" "}
        {filteredAndSortedFiles.length === 1 ? "file" : "files"} found
      </Typography>

      {/* File List */}
      {filteredAndSortedFiles.length === 0 ? (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary">
            No files match your search criteria.
          </Typography>
        </Box>
      ) : (
        <div className="flex flex-col space-y-2">
          {filteredAndSortedFiles.map((file) => (
            <div key={file._id} className="w-full">
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  "&:hover": { backgroundColor: "rgba(0,0,0,0.01)" },
                }}
              >
                {/* File Icon */}
                <Box sx={{ mr: 2 }}>{getFileIcon(file.fileType)}</Box>

                {/* File Details */}
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1" component="div">
                    {file.fileName}
                  </Typography>

                  <div className="flex flex-col sm:flex-row sm:items-center mt-1 mb-1">
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mr: 2 }}
                    >
                      {formatFileSize(file.fileSize)}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mr: 2 }}
                    >
                      Uploaded: {formatDate(file.uploadedAt)}
                    </Typography>

                    {file.uploadedBy?.name && (
                      <Typography variant="body2" color="text.secondary">
                        By: {file.uploadedBy.name}
                      </Typography>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 mt-1">
                    <Chip
                      label={file.projectName}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      label={file.taskTitle}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                    <Chip
                      label={file.fileType?.split("/")[1] || "Unknown type"}
                      size="small"
                      variant="outlined"
                    />
                  </div>
                </Box>

                {/* Actions */}
                <div className="flex">
                  <IconButton
                    color="primary"
                    onClick={() => handleDownload(file)}
                    title="Download file"
                  >
                    <CloudDownload />
                  </IconButton>

                  <IconButton
                    color="error"
                    onClick={() => handleDeleteFile(file)}
                    disabled={deleteInProgress === file._id}
                    title="Delete file"
                  >
                    {deleteInProgress === file._id ? (
                      <CircularProgress size={24} />
                    ) : (
                      <DeleteIcon />
                    )}
                  </IconButton>
                </div>
              </Paper>
            </div>
          ))}
        </div>
      )}
    </Paper>
  );
};
