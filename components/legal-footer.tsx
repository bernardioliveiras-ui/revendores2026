export function LegalFooter({ dark = false }: { dark?: boolean }) {
  const tone = dark ? "text-white/45 hover:text-white" : "text-[#60766f] hover:text-[#08705c]";
  return (
    <nav aria-label="Links legais" className={`flex flex-wrap gap-x-4 gap-y-2 text-xs ${tone}`}>
      <a href="/termos-de-uso">Termos de Uso</a>
      <a href="/politica-de-privacidade">Política de Privacidade</a>
      <a href="/cookies">Cookies</a>
      <a href="/reembolso-e-devolucao">Reembolso e Devolução</a>
    </nav>
  );
}
