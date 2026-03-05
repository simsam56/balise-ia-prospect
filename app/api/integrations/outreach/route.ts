import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      message:
        "Point d'entree reserve aux futures integrations outreach. Brancher ici l'envoi vers ton outil de cold email.",
    },
    { status: 501 },
  );
}
