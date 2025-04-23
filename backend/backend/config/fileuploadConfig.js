const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create storage engine
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "Project",
    resource_type: "auto", // Allow all file types
    use_filename: true,
    unique_filename: true,
    // Override the URL generation to include file extension
    format: async (req, file) => {
      // Extract extension from original filename
      const extension = file.originalname.split(".").pop().toLowerCase();
      // Return appropriate format based on mimetype or extension
      if (file.mimetype.includes("image")) return extension || "jpg";
      if (file.mimetype.includes("pdf")) return "pdf";
      if (file.mimetype.includes("text")) return "txt";
      if (extension === "docx" || extension === "doc") return extension;
      if (extension === "xlsx" || extension === "xls") return extension;
      // Return original extension or default to bin for binary files
      return extension || "bin";
    },
    // Set file size limit (10MB)
    limits: { fileSize: 10 * 1024 * 1024 },
  },
});

// Configure multer upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

module.exports = {
  cloudinary,
  upload,
};
