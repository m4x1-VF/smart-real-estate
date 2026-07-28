import 'server-only';
import { v2 as cloudinary } from 'cloudinary';

let configured = false;

export function getCloudinary(): typeof cloudinary {
  if (!configured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    configured = true;
  }
  return cloudinary;
}

export async function uploadImageToCloudinary(
  fileBuffer: Buffer,
  mimeType: string,
): Promise<string> {
  const cld = getCloudinary();
  const dataUri = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;

  const result = await cld.uploader.upload(dataUri, {
    folder: 'luxu-estate/properties/',
  });

  return result.secure_url;
}
