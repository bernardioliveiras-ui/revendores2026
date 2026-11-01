import { publicPageMetadata } from "@/lib/seo";
export const metadata = publicPageMetadata('Política de Cookies', 'Informações sobre cookies e tecnologias semelhantes usadas no Portal MIX10 PRO.', '/cookies');
import { LegalSection, LegalShell } from "@/components/legal-shell";

export default function CookiesPage() {
  return <LegalShell title="Política de Cookies" intro="Informações sobre cookies e tecnologias semelhantes usadas no Portal MIX10 PRO.">
    <p className="mb-8 text-xs text-[#789089]"><strong>Última atualização:</strong> 09/10/2026</p>
    <LegalSection title="1. O que usamos"><p>O portal utiliza tecnologias essenciais para manter a sessão autenticada, segurança, funcionamento das páginas e preferências estritamente necessárias à operação. A sessão de acesso é mantida por cookie protegido e vinculado ao login por e-mail.</p></LegalSection>
    <LegalSection title="2. Cookies não essenciais"><p>Quando as integrações estiverem configuradas, Google Analytics, Google Ads e Meta podem usar identificadores para medir visitas, anúncios, etapas do checkout e compras confirmadas. As ferramentas opcionais só são carregadas após sua escolha na landing ou na página de compra. Análise de visitas e publicidade podem ser aceitas ou recusadas separadamente. A recusa não impede a compra ou o acesso ao portal.</p></LegalSection>
    <LegalSection title="3. Preferências e prazos"><p>A escolha de privacidade é lembrada neste navegador por até 180 dias. A atribuição local e os identificadores vinculados a um pedido têm uma janela de uso de 30 dias, com limpeza periódica dos identificadores vencidos. Informações operacionais do pedido e registros de envio são mantidos separadamente. Cookies definidos por Google e Meta também seguem os prazos e controles de seus fornecedores.</p></LegalSection>
    <LegalSection title="4. Gerenciamento"><p>Na página inicial, use Preferências de cookies para rever sua escolha. A retirada interrompe as tags e solicita o bloqueio de conversões ainda não enviadas dos pedidos vinculados a este navegador. Se estiver sem conexão, a solicitação é retomada na próxima visita. Eventos já enviados não são desfeitos por esse controle. O navegador permite visualizar, bloquear ou apagar cookies; apagar o armazenamento também pode remover o vínculo local usado para essa retirada. Para pedidos em outro dispositivo ou solicitações sobre dados já enviados, utilize o contato abaixo. O bloqueio de cookies essenciais pode impedir o login.</p></LegalSection>
    <LegalSection title="5. Contato"><p>Para dúvidas sobre privacidade e cookies, escreva para <a className="font-bold text-[#08705c]" href="mailto:revendedor@lordnutri.com.br">revendedor@lordnutri.com.br</a>.</p></LegalSection>
  </LegalShell>;
}
