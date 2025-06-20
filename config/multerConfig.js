import multer from "multer";
import path from "path";
import fs from "fs";

// إعداد مسارات المجلدات
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const createStorage = (folder, prefix, allowedTypesRegex) => {
  const storagePath = `./uploads/${folder}`;
  ensureDir(storagePath);

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, storagePath),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${prefix}_${Date.now()}${ext}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    fileFilter: (req, file, cb) => {
      const isValid = allowedTypesRegex.test(path.extname(file.originalname).toLowerCase());
      isValid ? cb(null, true) : cb(new Error("File type not allowed"));
    },
  });
};

// رفع ملفات الواجبات
export const uploadSubmission = createStorage("submissions", "submission", /\.(pdf|docx|zip|rar|pptx|txt)$/);

// رفع الصور المصغرة للدورات
export const uploadThumbnail = createStorage("thumbnails", "thumb", /\.(jpg|jpeg|png|webp)$/);

// رفع محتوى الدروس (فيديو، PDF، إلخ)
export const uploadLessonContent = createStorage("lesson-content", "lesson", /\.(mp4|mov|webm|pdf|txt)$/);
