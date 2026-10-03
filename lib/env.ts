const truthy = new Set(["1", "true", "yes", "on"]);

export function getOptionalEnv(name: string) {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function getEnv(name: string) {
  const value = getOptionalEnv(name);
  if (!value) throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  return value;
}

export function getBooleanEnv(name: string, fallback = false) {
  const value = getOptionalEnv(name);
  return value ? truthy.has(value.toLowerCase()) : fallback;
}

export function getAppUrl() {
  return (getOptionalEnv("NEXT_PUBLIC_APP_URL") || "http://localhost:3000").replace(/\/$/, "");
}
