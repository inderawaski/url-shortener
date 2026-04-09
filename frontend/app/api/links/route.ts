import { NextResponse } from "next/server";

import { ApiError, createLink, listLinks } from "@/lib/links-api";

export async function GET() {
  try {
    const data = await listLinks();
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch links.";
    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      slug?: string;
      destination_url?: string;
    };
    const data = await createLink({
      slug: body.slug ?? "",
      destination_url: body.destination_url ?? "",
    });
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create link.";
    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
