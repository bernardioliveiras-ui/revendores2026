// Manual, BKO-initiated messages. Never include passwords or tokens in URLs.
export function normalizeBrazilianPhone(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (/^[1-9]\d{9,10}$/.test(digits)) return `55${digits}`;
  if (/^55[1-9]\d{9,10}$/.test(digits)) return digits;
  return null;
}

export function manualWelcomeMessage(name, origin) {
  const first = String(name ?? "").trim().split(/\s+/)[0].slice(0, 45) || "revendedor(a)";
  const base = String(origin ?? "").replace(/\/$/, "");
  return `Olá, ${first}! Bem-vindo(a) à LORD NUTRI!\n\nSeu pagamento foi confirmado e seu acesso ao portal do revendedor está liberado.\n\nAcesse: ${base}/entrar\nEntre com o e-mail usado no cadastro. Se ainda não recebeu sua senha provisória, solicite ao BKO. No primeiro acesso, você deverá definir uma nova senha.\n\nNossa equipe está à disposição!`;
}

export function manualWhatsAppLink({ name, phone, origin }) {
  const number = normalizeBrazilianPhone(phone);
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(manualWelcomeMessage(name, origin))}`;
}

export function manualEmailLink({ name, email, origin }) {
  const recipient = String(email ?? "").trim();
  if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(recipient) || recipient.length > 254) return null;
  return `mailto:${recipient}?subject=${encodeURIComponent("LORD NUTRI — Boas-vindas ao portal")}&body=${encodeURIComponent(manualWelcomeMessage(name, origin))}`;
}
