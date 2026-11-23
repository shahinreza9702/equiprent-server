
import { env } from "../../config/env.js";
import ApiError from "../../utils/api-error.js";
import HTTP_STATUS from "../../constants/http-status.js";

interface ImgBBResponse {
  success: boolean;
  data?: {
    url: string;
    display_url: string;
  };
  error?: {
    message?: string;
  };
}

const uploadEquipmentImage = async (
  file: Express.Multer.File,
): Promise<string> => {
  if (!env.IMGBB_API_KEY) {
    throw new ApiError(
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      "Image upload service is not configured",
    );
  }

  const formData = new FormData();

  const imageBlob = new Blob([new Uint8Array(file.buffer)], {
    type: file.mimetype,
  });

  formData.append("image", imageBlob, file.originalname);

  const uploadUrl = new URL(
    "https://api.imgbb.com/1/upload",
  );

  uploadUrl.searchParams.set("key", env.IMGBB_API_KEY);

  const response = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
  });

  const result =
    (await response.json()) as ImgBBResponse;

  if (!response.ok || !result.success || !result.data?.url) {
    throw new ApiError(
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      result.error?.message ?? "Image upload failed",
    );
  }

  return result.data.url;
};

export const equipmentImageService = {
  uploadEquipmentImage,
};
