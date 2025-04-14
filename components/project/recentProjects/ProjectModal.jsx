import React from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  MenuItem,
} from "../../../common/icons";
import { authServices } from "../../../auth";

export const ProjectModal = ({ isOpen, onRequestClose }) => {
  const { register, handleSubmit, reset } = useForm();
  const currentUser = authServices.getAuthUser(); // Retrieve stored user data
  const userId = currentUser ? currentUser._id : null; // Extract user ID // Extract the logged-in user ID
  const onSubmit = async (data) => {
    try {
      const response = await axios.post(
        "http://localhost:4000/projects/create",
        {
          name: data.name,
          description: data.description,
          status: data.status,
          createdBy: userId, // Replace with the actual user ID
        }
      );

      console.log("Project Created:", response.data);
      onRequestClose(); // Close modal after submission
      reset(); // Reset form
    } catch (error) {
      console.error("Error creating project:", error);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onRequestClose} fullWidth maxWidth="sm">
      <DialogTitle>Create New Project</DialogTitle>
      <DialogContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 p-4"
        >
          {/* Project Name */}
          <TextField
            label="Project Name"
            variant="outlined"
            {...register("name", { required: true })}
          />

          {/* Description */}
          <TextField
            label="Description"
            variant="outlined"
            multiline
            rows={3}
            {...register("description")}
          />

          {/* Status Dropdown */}
          <TextField
            select
            label="Status"
            variant="outlined"
            defaultValue="Planning"
            {...register("status")}
          >
            {["Planning", "Active", "On Hold", "Completed", "Archived"].map(
              (option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              )
            )}
          </TextField>

          {/* Submit Button */}
          <Button type="submit" variant="contained" color="primary">
            Create Project
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
