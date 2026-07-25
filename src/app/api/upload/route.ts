import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/storage";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const subFolder = (formData.get("subFolder") as string) || "campaigns";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const result = await uploadFile(file, subFolder);

    return NextResponse.json({
      success: true,
      url: result.url,
      filename: result.filename,
    });
  } catch (error: any) {
    console.error("Upload API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}
