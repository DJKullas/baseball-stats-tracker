import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      // The `onBeforeGenerateToken` callback is required and is called before a token
      // is generated for the client to upload the file.
      onBeforeGenerateToken: async (pathname) => {
        // Check if the user is authenticated before allowing an upload.
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          throw new Error("You must be logged in to upload a file.")
        }

        // The token is a required secret environment variable (BLOB_READ_WRITE_TOKEN).
        // The client-side `upload` function sends `access: 'public'`, which is respected here.
        return {
          allowedContentTypes: ["image/png", "image/jpeg", "image/gif", "image/webp"],
          addRandomSuffix: true,
        }
      },
      // This callback is called after the file has been successfully uploaded.
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log("✅ Blob upload completed!", blob.url, tokenPayload)
      },
    })

    // `handleUpload` returns the correct JSON response structure that the client expects.
    return NextResponse.json(jsonResponse)
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
