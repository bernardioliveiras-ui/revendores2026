export async function POST() {
  return Response.json(
    { complete: true, disabled: true, message: "Onboarding multi-organização desativado nesta versão." },
    { status: 200 },
  );
}
