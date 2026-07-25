import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notifications = await db.notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const unreadCount = await db.notification.count({
      where: { userId: session.userId, isRead: false },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (body.markAll) {
      await db.notification.updateMany({
        where: { userId: session.userId, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, message: "All notifications marked as read" });
    }

    if (body.notificationId) {
      await db.notification.update({
        where: { id: body.notificationId, userId: session.userId },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update notifications" }, { status: 500 });
  }
}
