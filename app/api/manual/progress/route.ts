export async function GET() {
  return Response.json({ progress: { lastPage: 1, completedAt: null }, disabled: true });
}

export async function POST() {
  return Response.json({ saved: true, disabled: true });
}
