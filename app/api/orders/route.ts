export async function GET() {
  return Response.json(
    { error: "Pedidos internos foram desativados. Use o checkout público e o BKO atual." },
    { status: 410 },
  );
}

export async function POST() {
  return Response.json(
    { error: "Pedidos internos foram desativados. Use /api/public/checkout." },
    { status: 410 },
  );
}
