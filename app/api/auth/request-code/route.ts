export async function POST() {
  return Response.json(
    { error: "O acesso por código foi desativado. Use e-mail e senha." },
    { status: 410 },
  );
}
