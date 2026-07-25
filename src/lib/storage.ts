import { promises as fs } from "fs";
import path from "path";
import { put, del } from "@vercel/blob";

// Define a common interface for file upload results
export interface UploadResult {
  url: string;
  filename: string;
}

/**
 * Uploads a file (uses Vercel Blob in production if token exists, falls back to Base64 on Vercel without token, saves locally in development)
 */
export async function uploadFile(
  file: File,
  subFolder: string = ""
): Promise<UploadResult> {
  const isProd = process.env.NODE_ENV === "production" || !!process.env.VERCEL;
  const useBlob = isProd && !!process.env.BLOB_READ_WRITE_TOKEN;

  // Create unique filename
  const fileExtension = path.extname(file.name);
  const cleanName = path
    .basename(file.name, fileExtension)
    .replace(/[^a-zA-Z0-9]/g, "_")
    .toLowerCase();
  const filename = `${cleanName}_${Date.now()}${fileExtension}`;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  if (useBlob) {
    // In production on Vercel, upload to Vercel Blob
    const blobPath = path.join("uploads", subFolder, filename).replace(/\\/g, "/");
    const blob = await put(blobPath, buffer, {
      access: "public",
    });

    return {
      url: blob.url,
      filename,
    };
  } else if (isProd) {
    // In production on Vercel, but no Vercel Blob token is configured.
    // Fall back to a base64 Data URI!
    const base64 = buffer.toString("base64");
    const mimeType = file.type || "image/png";
    const dataUri = `data:${mimeType};base64,${base64}`;

    return {
      url: dataUri,
      filename,
    };
  } else {
    // Local path configuration for local development
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
}

/**
 * Deletes a file (Vercel Blob in production, locally in development)
 */
export async function deleteFile(fileUrl: string): Promise<boolean> {
  try {
    const isProd = process.env.NODE_ENV === "production" || !!process.env.VERCEL;
    const useBlob = isProd && !!process.env.BLOB_READ_WRITE_TOKEN;

    if (fileUrl.startsWith("data:")) {
      return true; // No physical file to delete
    }

    if (useBlob) {
      if (fileUrl.includes("public.blob.vercel-storage.com")) {
        await del(fileUrl);
        return true;
      }
      return false;
    } else {
      if (!fileUrl.startsWith("/uploads/")) {
        return false; // Don't delete non-uploaded files
      }

      const filePath = path.join(process.cwd(), "public", fileUrl);
      await fs.unlink(filePath);
      return true;
    }
  } catch (error) {
    console.error(`Failed to delete file: ${fileUrl}`, error);
    return false;
  }
}
