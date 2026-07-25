import { promises as fs } from "fs";
import path from "path";

// Define a common interface for file upload results
export interface UploadResult {
  url: string;
  filename: string;
}

/**
 * Uploads a file (for development, saves locally to public/uploads)
 * This interface can be rewritten later to upload to S3/R2 by modifying this function
 * and keeping the signature identical.
 */
export async function uploadFile(
  file: File,
  subFolder: string = ""
): Promise<UploadResult> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Create unique filename
  const fileExtension = path.extname(file.name);
  const cleanName = path
    .basename(file.name, fileExtension)
    .replace(/[^a-zA-Z0-9]/g, "_")
    .toLowerCase();
  const filename = `${cleanName}_${Date.now()}${fileExtension}`;

  // Local path configuration
  const relativeUploadDir = path.join("uploads", subFolder);
  const uploadDir = path.join(process.cwd(), "public", relativeUploadDir);

  // Ensure directories exist
  await fs.mkdir(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, filename);
  await fs.writeFile(filePath, buffer);

  // Return the public URL for serving in Next.js
  const webPath = path.join("/", relativeUploadDir, filename).replace(/\\/g, "/");

  return {
    url: webPath,
    filename,
  };
}

/**
 * Deletes a file (locally during development)
 */
export async function deleteFile(fileUrl: string): Promise<boolean> {
  try {
    if (!fileUrl.startsWith("/uploads/")) {
      return false; // Don't delete non-uploaded files
    }

    const filePath = path.join(process.cwd(), "public", fileUrl);
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error(`Failed to delete file: ${fileUrl}`, error);
    return false;
  }
}
