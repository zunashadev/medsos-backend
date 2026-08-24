import multer from "multer";
import path from "path";

// Simpan file sementara di memory
const storage = multer.memoryStorage();

// Max size 5 MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed file extensions and MIME types
const allowedExtensions = [".jpg", ".jpeg", ".png"];
const allowedMimeTypes = ["image/jpeg", "image/png"];

// Tentukan file yang boleh masuk
const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();

  const isValidExtension = allowedExtensions.includes(extension);
  const isValidMimeType = allowedMimeTypes.includes(file.mimetype);

  if (!isValidExtension || !isValidMimeType) {
    return cb(new Error("Only JPG, JPEG, and PNG image files are allowed."));
  }

  cb(null, true);
};

// Buat middleware Multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
});

export default upload;
