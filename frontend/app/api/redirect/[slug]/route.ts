import { NextResponse } from "next/server";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  const apiBase = process.env.LINKS_API_BASE_URL;
  if (!apiBase) {
    return NextResponse.json(
      { error: "Missing LINKS_API_BASE_URL environment variable." },
      { status: 500 }
    );
  }

  const { slug } = await params;
  const normalizedBase = apiBase.replace(/\/$/, "");
  return NextResponse.redirect(`${normalizedBase}/${slug}`, { status: 307 });
}
