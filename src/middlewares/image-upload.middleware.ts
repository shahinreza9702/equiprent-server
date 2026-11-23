
import multer from "multer";

import ApiError from "../utils/api-error.js";
import HTTP_STATUS from "../constants/http-status.js";

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const imageUpload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 1,
  },

  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      callback(
        new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          "Only JPEG, PNG, and WebP images are allowed",
        ),
      );

      return;
    }

    callback(null, true);
  },
}).single("image");

export default imageUpload;
