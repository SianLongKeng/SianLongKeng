import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

// Client-side direct-to-blob upload (see @vercel/blob docs): the browser
// uploads the file straight to Blob storage, this route only ever hands out
// a short-lived signed token first and gets a completion ping after — the
// image bytes themselves never pass through this serverless function, which
// matters since function bodies are capped well below a typical photo size.
export async function POST(req: Request): Promise<NextResponse> {
  const body = (await req.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => {
        const token = cookies().get(SESSION_COOKIE)?.value;
        const session = token ? await verifySessionToken(token) : null;
        if (!session) {
          throw new Error("Unauthorized");
        }
        return {
          allowedContentTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
          addRandomSuffix: true,
          maximumSizeInBytes: 5 * 1024 * 1024,
        };
      },
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
