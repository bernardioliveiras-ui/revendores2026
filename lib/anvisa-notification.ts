/** Separa o texto livre do Studio apenas quando ele segue o padrão de notificação. */
export function parseAnvisaNotification(text: string) {
  const fullText = text.trim();
  const match = /^(.*?)\s+(ANVISA\s+N[º°o]\.?)\s+(\d[\d./-]*)$/i.exec(fullText);
  if (!match) return { fullText, heading: fullText, subtitle: "", number: "" };
  return {
    fullText,
    heading: match[1].trim(),
    subtitle: match[2].trim(),
    number: match[3],
  };
}
