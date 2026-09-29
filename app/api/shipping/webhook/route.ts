export async function POST() {
  return Response.json(
    { received: false, disabled: true, error: "Webhook logístico externo está desativado nesta versão." },
    { status: 410 },
  );
}
