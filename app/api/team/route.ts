export async function GET() {
  return Response.json(
    { members: [], invitations: [], disabled: true },
    { status: 200 },
  );
}

export async function POST() {
  return Response.json(
    { error: "Equipe multiusuário está desativada nesta versão." },
    { status: 410 },
  );
}

export async function PATCH() {
  return Response.json(
    { error: "Equipe multiusuário está desativada nesta versão." },
    { status: 410 },
  );
}
