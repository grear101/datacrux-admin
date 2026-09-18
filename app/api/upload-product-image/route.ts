import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// This route accepts an uploaded file and stores it in Vercel Blob Storage.
// Before touching storage at all, it re-checks the caller's login token
// against the real backend - the same trust anchor as everything else in
// this app, rather than duplicating the JWT secret into this project.
async function isAuthorized(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;

  const res = await fetch(`${API_URL}/clients/ai-settings`, {
    headers: { Authorization: authHeader },
  });
  return res.ok;
}

export async function POST(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed." }, { status: 400 });
  }

  const MAX_SIZE = 5 * 1024 * 1024; // 5MB - plenty for a product photo, keeps storage/bandwidth sane
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Image must be under 5MB." }, { status: 400 });
  }

  const blob = await put(`product-images/${Date.now()}-${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return NextResponse.json({ url: blob.url });
}
