export async function POST() {
  return Response.json(
    { error: "Login por código foi substituído por e-mail e senha nesta versão." },
    { status: 410 },
  );
}
