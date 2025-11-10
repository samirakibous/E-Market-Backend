import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configuration générique du storage
const createStorage = (uploadPath) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join('public', 'uploads', uploadPath);
      console.log('uploadDir', uploadDir);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });
};

// Filtre pour les images
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Seules les images sont autorisées (JPEG, PNG, GIF, WebP)'));
  }
};

// Upload de fichiers
export const createUpload = (uploadPath, fieldName, maxCount = 1) => {
  const uploadConfig = {
    storage: createStorage(uploadPath),
    fileFilter: imageFilter,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB max par fichier
    },
  };

  // Retourne le middleware adapté
  if (maxCount === 1) {
    return multer(uploadConfig).single(fieldName); // req.file
  } else {
    return multer(uploadConfig).array(fieldName, maxCount); // req.files
  }
};

export const createUploadFields = (uploadPath, fieldsArray) => {
  const uploadConfig = {
    storage: createStorage(uploadPath),
    fileFilter: imageFilter,
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  };
  return multer(uploadConfig).fields(fieldsArray);
};
