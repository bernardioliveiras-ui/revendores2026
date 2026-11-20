/** Sexta-feira estritamente posterior ao dia de liberação, em São Paulo. */
export function nextCashbackFriday(availableAt: string) {
  const instant = new Date(availableAt);
  if (!Number.isFinite(instant.getTime())) throw new Error("INVALID_DATE");
  const local = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(instant);
  const date = new Date(local + "T12:00:00Z");
  const days = (5 - date.getUTCDay() + 7) % 7 || 7;
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
