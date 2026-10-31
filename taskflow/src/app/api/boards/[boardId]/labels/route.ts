import { NextResponse } from "next/server";
import { createLabel, listLabels } from "@/server/services/label.service";
import { createLabelSchema } from "@/lib/validations/label.schema";
import { jsonError, parseBody } from "@/lib/api";

type Ctx = { params: Promise<{ boardId: string }> };

/**
 * TaskFlow — Étape 14 · labels du board.
 * GET  /api/boards/[boardId]/labels → palette (gate board:read)
 * POST /api/boards/[boardId]/labels → créer un label (gate label:manage)
 */

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const { boardId } = await params;
    const labels = await listLabels(boardId);
    return NextResponse.json({ labels });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request, { params }: Ctx) {
  try {
    const { boardId } = await params;
    const input = await parseBody(request, createLabelSchema);
    const label = await createLabel(boardId, input);
    return NextResponse.json({ label }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
