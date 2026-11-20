import axios from "axios";
import fs from "fs";
import path from "path";
import { logHiper, logError } from "../utils/logger";

// Cache in-memory for the authentication token
let tokenCache: { token: string; expiresAt: number } | null = null;

/**
 * Retorna o preço padrão de cada plano.
 */
function getPlanPrice(planMonths: number): number {
  if (planMonths === 1) return 109.9;
  if (planMonths === 3) return 229.7;
  if (planMonths === 5) return 349.7;
  return 109.9;
}

/**
 * Obtém ou renova o token do Hiper de forma dinâmica em memória.
 */
export async function getHiperToken(securityKey: string): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now) {
    return tokenCache.token;
  }

  const url = `${process.env.HIPER_API_URL || "https://ms-ecommerce.hiper.com.br/api/v1"}/auth/gerar-token/${encodeURIComponent(securityKey)}`;
  logHiper("Solicitando novo token de autenticação ao Hiper...");
  
  const response = await axios.get(url, { timeout: 10000 });
  const token = response.data?.token;
  if (!token) {
    throw new Error("Token não retornado pela API do Hiper.");
  }

  // Cache por 1 hora (com margem de 5 minutos de segurança)
  tokenCache = {
    token,
    expiresAt: now + (60 * 60 * 1000) - (5 * 60 * 1000)
  };

  return token;
}

/**
 * Procura um lead correspondente no arquivo leads.json para ser usado como fallback.
 */
export function findLeadForOrder(order: any): any {
  try {
    const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
    const leadsFile = path.join(dataDir, "leads.json");
    if (!fs.existsSync(leadsFile)) return null;
    const leads = JSON.parse(fs.readFileSync(leadsFile, "utf-8"));

    // 1. Tenta por paymentId
    if (order.paymentId) {
      const leadByPaymentId = leads.find((l: any) => l.paymentId === order.paymentId);
      if (leadByPaymentId) return leadByPaymentId;
    }

    // 2. Tenta por telefone (limpando caracteres não-numéricos)
    const orderPhone = order.customer?.phone || order.phone;
    if (orderPhone) {
      const cleanOrderPhone = orderPhone.replace(/\D/g, "");
      if (cleanOrderPhone) {
        const leadByPhone = leads.find((l: any) => l.phone && l.phone.replace(/\D/g, "") === cleanOrderPhone);
        if (leadByPhone) return leadByPhone;
      }
    }

    // 3. Tenta por email
    const orderEmail = order.customer?.email || order.email;
    if (orderEmail) {
      const cleanOrderEmail = orderEmail.toLowerCase().trim();
      if (cleanOrderEmail) {
        const leadByEmail = leads.find((l: any) => l.email && l.email.toLowerCase().trim() === cleanOrderEmail);
        if (leadByEmail) return leadByEmail;
      }
    }
  } catch (e) {
    console.error("[HIPER ERP] Erro ao buscar lead para fallback:", e);
  }
  return null;
}

/**
 * Arredonda valores monetários para 2 casas decimais.
 */
export function roundCurrency(value: number): number {
  return parseFloat(value.toFixed(2));
}

/**
 * Retorna o ID do meio de pagamento do Hiper ERP com base no método recebido.
 */
export function getHiperPaymentMethodId(method: string | null | undefined): number | null {
  if (!method) return null;
  const normalized = method.toLowerCase().trim();
  
  if (normalized === "pix") {
    return parseInt(process.env.HIPER_PAYMENT_PIX || "12", 10);
  }
  if (normalized === "credit" || normalized === "credit_card" || normalized === "cartao_credito" || normalized === "cartão de crédito") {
    return parseInt(process.env.HIPER_PAYMENT_CREDIT || "4", 10);
  }
  if (normalized === "debit" || normalized === "debit_card" || normalized === "cartao_debito" || normalized === "cartão de débito") {
    return parseInt(process.env.HIPER_PAYMENT_DEBIT || "5", 10);
  }
  if (normalized === "dinheiro" || normalized === "cash") {
    return parseInt(process.env.HIPER_PAYMENT_CASH || "1", 10);
  }
  if (normalized === "boleto") {
    return parseInt(process.env.HIPER_PAYMENT_BOLETO || "3", 10);
  }
  return null;
}

/**
 * Mapeia o pedido interno para o formato esperado pelo payload do Hiper ERP.
 */
export function mapOrderToHiperPayload(order: any, lead: any) {
  let planMonths = order.planMonths;
  if (!planMonths && lead) {
    if (lead.planId === 1) planMonths = 1;
    else if (lead.planId === 2) planMonths = 3;
    else if (lead.planId === 3) planMonths = 5;
  }
  if (!planMonths) {
    planMonths = 1;
  }

  // 1. Quantidade baseada no plano/kit vendido ou quantidade de caixas
  const orderQuantity = Math.max(1, Number(order.quantity || order.analytics?.quantity || lead?.quantity || 1));
  let quantidade = planMonths === 3 ? 3 : planMonths === 5 ? 5 : orderQuantity;

  const basePlanPrice = getPlanPrice(planMonths);
  const planPrice = planMonths === 1 ? roundCurrency(basePlanPrice * orderQuantity) : basePlanPrice;
  const originalValue = order.originalValue || order.finalValue || planPrice;

  // 2. Separação do frete (arredondado)
  const isFreeShipping = order.couponType === "free_shipping";
  const originalShipping = order.originalShippingValue !== undefined ? order.originalShippingValue : roundCurrency(Math.max(0, originalValue - planPrice));
  const valorDoFrete = order.finalShippingValue !== undefined ? order.finalShippingValue : (isFreeShipping ? 0 : originalShipping);

  // 3. Preço unitário proporcional com base nos valores reais (arredondado)
  const valorOriginalProdutos = originalValue - originalShipping;
  const discount = isFreeShipping ? 0 : (order.discount || 0);
  const valorProdutosComDesconto = Math.max(0, valorOriginalProdutos - discount);

  const precoUnitarioBruto = roundCurrency(valorOriginalProdutos / quantidade);
  const precoUnitarioLiquido = roundCurrency(valorProdutosComDesconto / quantidade);

  // Produto único do Hiper
  const produtoId = process.env.HIPER_PRODUCT_MIX10 || "";

  // Meio de pagamento corrigido conforme exigências
  const rawPaymentMethod = order.paymentMethod || lead?.paymentMethod || "";
  const idMeioDePagamento = getHiperPaymentMethodId(rawPaymentMethod);

  // Dados do endereço vindos do lead (fallback)
  let leadCity = "";
  let leadState = "";
  if (lead?.cityState) {
    const parts = lead.cityState.split("/");
    leadCity = parts[0]?.trim() || "";
    leadState = parts[1]?.trim() || "";
  }

  const customerName = order.customer?.name || order.customerName || lead?.name || "";
  const customerDoc = order.customer?.cpf || order.cpf || lead?.cpf || "";
  const customerEmail = order.customer?.email || order.email || lead?.email || "";
  const customerPhone = order.customer?.phone || order.phone || lead?.phone || "";

  const addrCep = order.address?.cep || order.zipCode || lead?.zipCode || "";
  const addrLogradouro = order.address?.logradouro || order.addressName || lead?.address || "";
  const addrNumero = order.address?.numero || order.addressNumber || lead?.addressNumber || "";
  const addrComplemento = order.address?.complemento || order.complement || lead?.complement || "";
  const addrBairro = order.address?.bairro || order.province || lead?.province || "";
  const addrCidade = order.address?.cidade || leadCity || "";
  const addrEstado = order.address?.estado || leadState || "";

  const rawIbge = order.address?.codigoIbge ?? order.codigoIbge ?? lead?.codigoIbge ?? 0;
  let codigoIbge = parseInt(String(rawIbge).trim(), 10) || 0;

  // Fallback para Osasco/SP caso ViaCEP não retorne IBGE (ou seja 0) e seja Osasco/SP
  const isOsascoCity = (addrCidade && addrCidade.toLowerCase().trim() === "osasco" && addrEstado && addrEstado.toLowerCase().trim() === "sp");
  if (codigoIbge === 0 && isOsascoCity) {
    codigoIbge = 3534401;
  }

  // Total do pagamento = produtos líquidos (unitário líquido * qty) + frete (arredondado)
  const totalCalculadoItens = roundCurrency(precoUnitarioLiquido * quantidade);
  const valorTotalPagamento = roundCurrency(totalCalculadoItens + valorDoFrete);

  const cleanedDoc = customerDoc.replace(/\D/g, "");

  const addressBlock = {
    bairro: addrBairro,
    cep: addrCep,
    codigoIbge: codigoIbge,
    complemento: addrComplemento,
    logradouro: addrLogradouro,
    numero: addrNumero
  };

  // Observação do pedido de venda
  let observacao = order.observacaoDoPedidoDeVenda || order.observation || "Pedido enviado pelo checkout Mix10 Pro";
  if (customerPhone) {
    const cleanPhone = String(customerPhone).replace(/\D/g, "");
    if (cleanPhone) {
      observacao = `${observacao} | Telefone: ${cleanPhone}`;
    }
  }

  return {
    cliente: {
      documento: cleanedDoc,
      email: customerEmail,
      inscricaoEstadual: "",
      nomeDoCliente: customerName,
      nomeFantasia: ""
    },
    enderecoDeCobranca: addressBlock,
    enderecoDeEntrega: addressBlock,
    itens: [
      {
        produtoId: produtoId,
        quantidade: quantidade,
        precoUnitarioBruto: precoUnitarioBruto,
        precoUnitarioLiquido: precoUnitarioLiquido
      }
    ],
    meiosDePagamento: idMeioDePagamento !== null ? [
      {
        idMeioDePagamento: idMeioDePagamento,
        parcelas: order.installments || 1,
        // The ERP order value represents the net commercial value of items (order.finalValue).
        // Since Hiper ERP strictly validates payment method total against sum(items) + freight
        // and does not have a separate financial interest/surcharge field, we send valorTotalPagamento
        // (which equals order.finalValue) to pass validation. Interest is logged separately for accounting.
        valor: valorTotalPagamento
      }
    ] : [],
    numeroPedidoDeVenda: order.id,
    observacaoDoPedidoDeVenda: observacao,
    valorDoFrete: valorDoFrete
  };
}

/**
 * Envia o pedido para o Hiper ERP.
 */
export async function sendOrderToHiper(order: any, forceSend: boolean = false) {
  const securityKey = process.env.HIPER_SECURITY_KEY;
  
  // 1. Validação crítica de credenciais antes de qualquer operação
  if (!securityKey || securityKey.trim() === "") {
    return {
      success: false,
      status: "failed",
      hiperOrderId: null,
      sentAt: new Date().toISOString(),
      error: "Validação falhou: HIPER_SECURITY_KEY não preenchida nas variáveis de ambiente.",
      lastPayload: null,
      lastResponse: null
    };
  }

  // Produto único do Hiper
  const hiperProductId = process.env.HIPER_PRODUCT_MIX10;
  if (!hiperProductId || hiperProductId.trim() === "") {
    return {
      success: false,
      status: "failed",
      hiperOrderId: null,
      sentAt: new Date().toISOString(),
      error: "Validação falhou: HIPER_PRODUCT_MIX10 não preenchido nas variáveis de ambiente.",
      lastPayload: null,
      lastResponse: null
    };
  }

  // Busca do lead para fallback
  const lead = findLeadForOrder(order);

  // Mapeamento de plano e quantidade
  let planMonths = order.planMonths;
  if (!planMonths && lead) {
    if (lead.planId === 1) planMonths = 1;
    else if (lead.planId === 2) planMonths = 3;
    else if (lead.planId === 3) planMonths = 5;
  }
  if (!planMonths) {
    planMonths = 1;
  }

  const orderQuantity = Math.max(1, Number(order.quantity || order.analytics?.quantity || lead?.quantity || 1));
  let quantidade = planMonths === 3 ? 3 : planMonths === 5 ? 5 : orderQuantity;

  // Validação: quantidade foi identificada corretamente (pelo menos 1)
  if (typeof quantidade !== "number" || isNaN(quantidade) || quantidade < 1) {
    return {
      success: false,
      status: "failed",
      hiperOrderId: null,
      sentAt: new Date().toISOString(),
      error: `Validação falhou: Quantidade identificada incorretamente (${quantidade}). Deve ser pelo menos 1.`,
      lastPayload: null,
      lastResponse: null
    };
  }

  // Separação e validação do frete
  const basePlanPrice = getPlanPrice(planMonths);
  const planPrice = planMonths === 1 ? roundCurrency(basePlanPrice * orderQuantity) : basePlanPrice;
  const originalValue = order.originalValue || order.finalValue || planPrice;
  const isFreeShipping = order.couponType === "free_shipping";
  const originalShipping = order.originalShippingValue !== undefined ? order.originalShippingValue : Math.max(0, originalValue - planPrice);
  const valorDoFrete = order.finalShippingValue !== undefined ? order.finalShippingValue : originalShipping;

  if (typeof valorDoFrete !== "number" || isNaN(valorDoFrete) || valorDoFrete < 0) {
    return {
      success: false,
      status: "failed",
      hiperOrderId: null,
      sentAt: new Date().toISOString(),
      error: `Validação falhou: Valor do frete separado incorretamente (R$ ${valorDoFrete}).`,
      lastPayload: null,
      lastResponse: null
    };
  }

  // 2. Validação de flag de ativação (HIPER_ENABLED)
  const enabled = process.env.HIPER_ENABLED === "true";
  const isProduction = process.env.NODE_ENV === "production";

  if (!enabled && !forceSend) {
    if (isProduction) {
      logHiper(`Integração desabilitada em produção. Pedido ${order.id} não enviado.`);
      return {
        success: false,
        status: "disabled",
        hiperOrderId: null,
        sentAt: null,
        error: "Integração desabilitada em produção",
        lastPayload: null,
        lastResponse: null
      };
    } else {
      logHiper(`Desenvolvimento local com integração desabilitada. Mockando envio do pedido: ${order.id}`);
      return {
        success: true,
        status: "sent",
        hiperOrderId: `MOCK-HIPER-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        sentAt: new Date().toISOString(),
        error: null,
        lastPayload: null,
        lastResponse: { message: "Mock local de desenvolvimento com sucesso." }
      };
    }
  }

  // 3. Validação dos dados obrigatórios mínimos (Cliente e Endereço)
  const customerName = order.customer?.name || order.customerName || lead?.name || "";
  const customerDoc = order.customer?.cpf || order.cpf || lead?.cpf || "";
  const customerEmail = order.customer?.email || order.email || lead?.email || "";

  if (!customerName || customerName.trim() === "") {
    return {
      success: false,
      status: "failed",
      hiperOrderId: null,
      sentAt: new Date().toISOString(),
      error: "Validação falhou: Nome do cliente ausente ou não encontrado.",
      lastPayload: null,
      lastResponse: null
    };
  }
  if (!customerDoc || customerDoc.trim() === "") {
    return {
      success: false,
      status: "failed",
      hiperOrderId: null,
      sentAt: new Date().toISOString(),
      error: "Validação falhou: CPF/Documento do cliente ausente ou não encontrado.",
      lastPayload: null,
      lastResponse: null
    };
  }
  if (!customerEmail || customerEmail.trim() === "") {
    return {
      success: false,
      status: "failed",
      hiperOrderId: null,
      sentAt: new Date().toISOString(),
      error: "Validação falhou: E-mail do cliente ausente ou não encontrado.",
      lastPayload: null,
      lastResponse: null
    };
  }

  const addrCep = order.address?.cep || order.zipCode || lead?.zipCode || "";
  const addrLogradouro = order.address?.logradouro || order.addressName || lead?.address || "";
  const addrNumero = order.address?.numero || order.addressNumber || lead?.addressNumber || "";
  const addrBairro = order.address?.bairro || order.province || lead?.province || "";

  if (!addrCep || addrCep.trim() === "") {
    return {
      success: false,
      status: "failed",
      hiperOrderId: null,
      sentAt: new Date().toISOString(),
      error: "Validação falhou: CEP de endereço ausente ou não encontrado.",
      lastPayload: null,
      lastResponse: null
    };
  }
  if (!addrLogradouro || addrLogradouro.trim() === "") {
    return {
      success: false,
      status: "failed",
      hiperOrderId: null,
      sentAt: new Date().toISOString(),
      error: "Validação falhou: Logradouro do endereço ausente ou não encontrado.",
      lastPayload: null,
      lastResponse: null
    };
  }
  if (!addrNumero || addrNumero.trim() === "") {
    return {
      success: false,
      status: "failed",
      hiperOrderId: null,
      sentAt: new Date().toISOString(),
      error: "Validação falhou: Número do endereço ausente ou não encontrado.",
      lastPayload: null,
      lastResponse: null
    };
  }
  if (!addrBairro || addrBairro.trim() === "") {
    return {
      success: false,
      status: "failed",
      hiperOrderId: null,
      sentAt: new Date().toISOString(),
      error: "Validação falhou: Bairro do endereço ausente ou não encontrado.",
      lastPayload: null,
      lastResponse: null
    };
  }

  // Validação do meio de pagamento e valor final
  const finalValue = order.finalValue;
  if (finalValue === undefined || finalValue === null || finalValue <= 0) {
    return {
      success: false,
      status: "failed",
      hiperOrderId: null,
      sentAt: new Date().toISOString(),
      error: "Validação falhou: Valor final do pedido inválido ou não encontrado.",
      lastPayload: null,
      lastResponse: null
    };
  }

  const rawPaymentMethod = order.paymentMethod || lead?.paymentMethod || "";
  const idMeioDePagamento = getHiperPaymentMethodId(rawPaymentMethod);

  if (!idMeioDePagamento || isNaN(idMeioDePagamento)) {
    return {
      success: false,
      status: "failed",
      hiperOrderId: null,
      sentAt: new Date().toISOString(),
      error: "Forma de pagamento ausente ou inválida para o Hiper.",
      lastPayload: null,
      lastResponse: null
    };
  }

  const discount = isFreeShipping ? 0 : (order.discount || 0);
  const valorOriginalProdutos = originalValue - originalShipping;
  const valorProdutosComDesconto = Math.max(0, valorOriginalProdutos - discount);

  const precoUnitarioBruto = roundCurrency(valorOriginalProdutos / quantidade);
  const precoUnitarioLiquido = roundCurrency(valorProdutosComDesconto / quantidade);

  const totalCalculadoItens = roundCurrency(precoUnitarioLiquido * quantidade);
  const valorTotalPagamento = roundCurrency(totalCalculadoItens + valorDoFrete);

  // Validação: meiosDePagamento.valor corresponde ao total pago (produtos com desconto + frete) com margem pequena de arredondamento
  if (Math.abs(valorTotalPagamento - order.finalValue) > 0.05) {
    return {
      success: false,
      status: "failed",
      hiperOrderId: null,
      sentAt: new Date().toISOString(),
      error: `Validação falhou: O valor total pago (R$ ${order.finalValue}) diverge da soma de produtos com desconto (R$ ${totalCalculadoItens}) + frete (R$ ${valorDoFrete}).`,
      lastPayload: null,
      lastResponse: null
    };
  }

  // 4. Se chegou aqui, realiza o envio real
  let payloadForLog: any = null;
  try {
    const token = await getHiperToken(securityKey);
    const client = axios.create({
      baseURL: process.env.HIPER_API_URL || "https://ms-ecommerce.hiper.com.br/api/v1",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    });

    const payload = mapOrderToHiperPayload(order, lead);
    
    // Prepara payload com dados mascarados/redigidos para log
    const redactedPayload = JSON.parse(JSON.stringify(payload));
    if (redactedPayload.cliente && redactedPayload.cliente.documento) {
      const doc = redactedPayload.cliente.documento;
      if (doc.length > 5) {
        redactedPayload.cliente.documento = doc.substring(0, 3) + ".***.***-" + doc.substring(doc.length - 2);
      } else {
        redactedPayload.cliente.documento = "***";
      }
    }
    payloadForLog = redactedPayload;

    logHiper(`Enviando pedido ${order.id} ao Hiper ERP. Payload: ${JSON.stringify(payloadForLog)}`);
    const response = await client.post("/pedido-de-venda/", payload);

    logHiper(`Pedido ${order.id} enviado ao Hiper com sucesso. Resposta HTTP 200/201. ID retornado no Hiper: ${response.data?.numeroPedidoDeVenda || response.data?.id || 'N/A'}. Resposta: ${JSON.stringify(response.data)}`);

    return {
      success: true,
      status: "sent",
      hiperOrderId: response.data?.numeroPedidoDeVenda || response.data?.id || `HIPER-${order.id}`,
      sentAt: new Date().toISOString(),
      error: null,
      lastPayload: payloadForLog,
      lastResponse: response.data
    };
  } catch (error: any) {
    const errorMsg = error.response?.data?.mensagem || error.response?.data?.error || error.message || "Erro desconhecido";
    logError(`Erro no envio do pedido ${order.id} ao Hiper ERP: ${errorMsg}`, error);
    logHiper(`Erro no envio do pedido ${order.id} ao Hiper ERP. Resposta HTTP ${error.response?.status || 'N/A'}. Erro: ${JSON.stringify(error.response?.data || error.message)}`);
    
    // Garante payload formatado para log em caso de erro
    if (!payloadForLog) {
      try {
        const payload = mapOrderToHiperPayload(order, lead);
        const redactedPayload = JSON.parse(JSON.stringify(payload));
        if (redactedPayload.cliente && redactedPayload.cliente.documento) {
          const doc = redactedPayload.cliente.documento;
          if (doc.length > 5) {
            redactedPayload.cliente.documento = doc.substring(0, 3) + ".***.***-" + doc.substring(doc.length - 2);
          } else {
            redactedPayload.cliente.documento = "***";
          }
        }
        payloadForLog = redactedPayload;
      } catch (_) {}
    }

    return {
      success: false,
      status: "failed",
      hiperOrderId: null,
      sentAt: new Date().toISOString(),
      error: errorMsg,
      lastPayload: payloadForLog,
      lastResponse: error.response?.data || { message: error.message },
      hiperHttpStatus: error.response?.status || null,
      endpoint: (error.config && error.config.url)
        ? (error.config.baseURL ? `${error.config.baseURL}${error.config.url}` : error.config.url)
        : "https://ms-ecommerce.hiper.com.br/api/v1/pedido-de-venda/"
    };
  }
}
