export async function PATCH() {
  return Response.json(
    { error: "Pedidos administrativos antigos foram substituídos por /api/admin/shipping." },
    { status: 410 },
  );
}
