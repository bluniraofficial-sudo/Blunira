import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { LeadService } from "@/services/lead";

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await props.params;

    if (!id) {
      return NextResponse.json({ error: "Lead ID is required" }, { status: 400 });
    }

    await LeadService.delete(id, session);

    return NextResponse.json({ success: true, message: "Lead deleted successfully" });
  } catch (error: any) {
    console.error("Lead Delete API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete lead" },
      { status: 500 }
    );
  }
}
