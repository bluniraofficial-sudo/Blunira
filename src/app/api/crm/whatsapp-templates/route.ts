import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    let advertiserId = searchParams.get("advertiserId") || undefined;
    if (session.role === "ADVERTISER") {
      advertiserId = session.advertiserId || undefined;
    }

    const getSetting = async (key: string) => {
      if (advertiserId) {
        const found = await db.settings.findUnique({ where: { key: `${key}_${advertiserId}` } });
        if (found) return found.value;
      }
      const foundGlobal = await db.settings.findUnique({ where: { key } });
      return foundGlobal ? foundGlobal.value : "";
    };

    const token = await getSetting("WHATSAPP_API_TOKEN");
    const wabaId = await getSetting("WHATSAPP_WABA_ID");

    if (!token || !wabaId) {
      return NextResponse.json(
        { error: "Meta Access Token and WhatsApp Business Account ID (WABA ID) must be configured and saved first." },
        { status: 400 }
      );
    }

    const res = await fetch(`https://graph.facebook.com/v20.0/${wabaId}/message_templates?limit=100`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      let parsedErr: any;
      try {
        parsedErr = JSON.parse(errText);
      } catch (e) {
        parsedErr = null;
      }
      const errMsg = parsedErr?.error?.message || `HTTP ${res.status}: ${errText}`;
      return NextResponse.json({ error: errMsg }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data.data || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch WhatsApp templates" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADVERTISER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, category, language, bodyText, sampleValues, headerImageUrl, advertiserId: reqAdvertiserId } = await req.json();

    let advertiserId = reqAdvertiserId || undefined;
    if (session.role === "ADVERTISER") {
      advertiserId = session.advertiserId || undefined;
    }

    if (!name || !category || !language || !bodyText) {
      return NextResponse.json({ error: "Missing required template fields." }, { status: 400 });
    }

    const getSetting = async (key: string) => {
      if (advertiserId) {
        const found = await db.settings.findUnique({ where: { key: `${key}_${advertiserId}` } });
        if (found) return found.value;
      }
      const foundGlobal = await db.settings.findUnique({ where: { key } });
      return foundGlobal ? foundGlobal.value : "";
    };

    // Load WABA ID and Token
    const token = await getSetting("WHATSAPP_API_TOKEN");
    const wabaId = await getSetting("WHATSAPP_WABA_ID");

    if (!token || !wabaId) {
      return NextResponse.json({ error: "Meta WABA ID and Access Token must be configured first." }, { status: 400 });
    }

    // Build the Meta message template creation payload
    const components: any[] = [];

    // Image Header Upload Logic
    if (headerImageUrl) {
      try {
        // 1. Get the Meta App ID from access token
        const appRes = await fetch("https://graph.facebook.com/v20.0/app", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!appRes.ok) {
          const appErr = await appRes.text();
          throw new Error(`Failed to resolve App ID: ${appErr}`);
        }
        const appData = await appRes.json();
        const appId = appData.id;
        if (!appId) throw new Error("App ID could not be retrieved from Meta token info.");

        // 2. Fetch the image data
        const imgRes = await fetch(headerImageUrl);
        if (!imgRes.ok) throw new Error(`Could not access the image URL: ${headerImageUrl}`);
        const arrayBuffer = await imgRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileLength = buffer.length;
        const contentType = imgRes.headers.get("content-type") || "image/jpeg";

        // 3. Initiate Meta upload session
        const initRes = await fetch(`https://graph.facebook.com/v20.0/${appId}/uploads?file_name=header_sample.jpg&file_length=${fileLength}&file_type=${contentType}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        });
        if (!initRes.ok) {
          const initErr = await initRes.text();
          throw new Error(`Meta upload initiation rejected: ${initErr}`);
        }
        const initData = await initRes.json();
        const sessionId = initData.id;
        if (!sessionId) throw new Error("Meta did not return a valid upload session ID.");

        // 4. Upload raw binary buffer to session
        const uploadRes = await fetch(`https://graph.facebook.com/v20.0/${sessionId}`, {
          method: "POST",
          headers: {
            Authorization: `OAuth ${token}`,
            "file_offset": "0",
            "Content-Type": "application/octet-stream",
          },
          body: buffer,
        });
        if (!uploadRes.ok) {
          const uploadErr = await uploadRes.text();
          throw new Error(`Meta binary upload rejected: ${uploadErr}`);
        }
        const uploadData = await uploadRes.json();
        const headerHandle = uploadData.h;
        if (!headerHandle) throw new Error("Meta upload did not return a file handle.");

        // 5. Append HEADER component
        components.push({
          type: "HEADER",
          format: "IMAGE",
          example: {
            header_handle: [headerHandle]
          }
        });
      } catch (err: any) {
        return NextResponse.json({ error: `Image Header Upload Failed: ${err.message || "Unknown error"}` }, { status: 400 });
      }
    }

    const bodyComponent: any = {
      type: "BODY",
      text: bodyText,
    };

    // If there are sample values, add example.body_text
    if (Array.isArray(sampleValues) && sampleValues.length > 0) {
      bodyComponent.example = {
        body_text: [sampleValues]
      };
    }
    components.push(bodyComponent);

    const payload = {
      name: name.toLowerCase().replace(/[^a-z0-9_]/g, ""), // Sanitize name (lowercase, numbers, underscores only)
      category,
      language,
      components,
    };

    const res = await fetch(`https://graph.facebook.com/v20.0/${wabaId}/message_templates`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      let parsedErr: any;
      try {
        parsedErr = JSON.parse(errText);
      } catch (e) {
        parsedErr = null;
      }
      const errMsg = parsedErr?.error?.message || `HTTP ${res.status}: ${errText}`;
      return NextResponse.json({ error: errMsg }, { status: res.status });
    }

    const result = await res.json();
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create message template" }, { status: 500 });
  }
}
