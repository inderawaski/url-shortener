import { NextResponse } from "next/server";

import { ApiError, deleteLink, getLinkDetails, updateLink } from "@/lib/links-api";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { slug } = await params;
    const data = await getLinkDetails(slug);
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch link details.";
    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { slug } = await params;
    const body = (await request.json()) as { destination_url?: string };
    const data = await updateLink(slug, {
      destination_url: body.destination_url ?? "",
    });
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update link.";
    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { slug } = await params;
    const data = await deleteLink(slug);
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete link.";
    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
