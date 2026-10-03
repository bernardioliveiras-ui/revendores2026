import { LegalSection, LegalShell } from "@/components/legal-shell";

export default function CookiesPage() {
  return <LegalShell title="Política de Cookies" intro="Informações sobre cookies e tecnologias semelhantes usadas no Portal MIX10 PRO.">
    <p className="mb-8 text-xs text-[#dfb961]"><strong>Última atualização:</strong> 11/09/2026</p>
    <LegalSection title="1. O que usamos"><p>O portal utiliza tecnologias essenciais para manter a sessão autenticada, segurança, funcionamento das páginas e preferências estritamente necessárias à operação. A sessão de acesso é mantida por cookie protegido e vinculado ao login por e-mail.</p></LegalSection>
    <LegalSection title="2. Cookies não essenciais"><p>Se no futuro forem adicionadas ferramentas de publicidade, perfilamento ou analytics que dependam de cookies não essenciais, esta política e os mecanismos de escolha serão atualizados antes de sua utilização quando a legislação exigir.</p></LegalSection>
    <LegalSection title="3. Gerenciamento"><p>O navegador permite visualizar, bloquear ou apagar cookies. O bloqueio de cookies essenciais pode impedir o login ou outras funções do portal.</p></LegalSection>
    <LegalSection title="4. Contato"><p>Para dúvidas sobre privacidade e cookies, escreva para <a className="font-bold text-[#dfb961]" href="mailto:revendedor@lordnutri.com.br">revendedor@lordnutri.com.br</a>.</p></LegalSection>
  </LegalShell>;
}
