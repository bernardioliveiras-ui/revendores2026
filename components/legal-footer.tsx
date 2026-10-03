export function LegalFooter({ dark = false }: { dark?: boolean }) {
  const tone = dark ? "text-white/45 hover:text-white" : "text-[#c8c3b9] hover:text-[#c8c3b9]";
  return (
    <nav aria-label="Links legais" className={`flex flex-wrap gap-x-4 gap-y-2 text-xs ${tone}`}>
      <a href="/termos-de-uso">Termos de Uso</a>
      <a href="/politica-de-privacidade">Política de Privacidade</a>
      <a href="/cookies">Cookies</a>
      <a href="/reembolso-e-devolucao">Reembolso e Devolução</a>
    </nav>
  );
}
