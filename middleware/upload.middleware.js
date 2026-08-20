import multer from "multer";
import path from "path";

// Simpan file sementara di RAM
const storage = multer.memoryStorage();

// Tentukan file apa yang boleh masuk
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png") {
    return cb(new Error("File yang diinput hanya bisa berformat gambar (.jpg, .jpeg, .png)"));
  }

  cb(null, true);
};

// Buat middleware Multer
const upload = multer({
  storage,
  fileFilter,
});

export default upload;
