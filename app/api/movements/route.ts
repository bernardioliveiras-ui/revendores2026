export async function GET() {
  return Response.json(
    { movements: [], summary: null, disabled: true },
    { status: 200 },
  );
}

export async function POST() {
  return Response.json(
    { error: "Movimentações antigas foram substituídas por /api/sales e /api/stock." },
    { status: 410 },
  );
}
