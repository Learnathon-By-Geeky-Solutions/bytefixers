import React, { useState } from "react";
import { authServices } from "../../auth";

export const FileUpload = ({ taskId, onFileUploaded }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const currentUser = authServices.getAuthUser();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (selectedFile) {
      // Check file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File size exceeds 10MB limit");
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      setError("Please select a file");
      return;
    }

    try {
      setUploading(true);
      setProgress(10);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", currentUser._id);

      setProgress(30);

      const response = await fetch(
        `http://localhost:4000/files/upload/${taskId}`,
        {
          method: "POST",
          body: formData,
          // No Content-Type header is needed as it will be set automatically
        }
      );

      setProgress(90);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error uploading file");
      }

      const data = await response.json();
      setProgress(100);
      setFile(null);
      alert("File uploaded successfully");
      // Call the callback function to update parent component
      if (onFileUploaded) {
        onFileUploaded(data);
      }
    } catch (err) {
      console.error("Error uploading file:", err);
      setError(err.message || "Error uploading file");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-4">
      <form onSubmit={handleUpload} className="flex flex-col space-y-2">
        <div className="flex items-center border rounded p-2">
          <input
            type="file"
            onChange={handleFileChange}
            className="flex-1 text-sm"
            disabled={uploading}
          />
          <button
            type="submit"
            className={`ml-2 px-4 py-1 text-white rounded ${
              uploading ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"
            }`}
            disabled={uploading || !file}
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        {uploading && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}

        <div className="text-xs text-gray-500">Max file size: 10MB</div>
      </form>
    </div>
  );
};
