const STATES = new Set(["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"]);

function digits(value) { return typeof value === "string" ? value.replace(/\D/g, "") : ""; }
function text(value, max) { return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, max + 1) : ""; }

export function validCpfCnpj(value) {
  const d = digits(value);
  if (![11,14].includes(d.length) || /^(\d)\1+$/.test(d)) return false;
  if (d.length === 11) {
    for (let i = 9; i < 11; i++) {
      let total = 0;
      for (let j = 0; j < i; j++) total += Number(d[j]) * (i + 1 - j);
      const check = (total * 10) % 11;
      if ((check === 10 ? 0 : check) !== Number(d[i])) return false;
    }
    return true;
  }
  for (let i = 12; i < 14; i++) {
    const weights = i === 12 ? [5,4,3,2,9,8,7,6,5,4,3,2] : [6,5,4,3,2,9,8,7,6,5,4,3,2];
    const sum = weights.reduce((n,w,j) => n + Number(d[j]) * w, 0);
    const remainder = sum % 11;
    if ((remainder < 2 ? 0 : 11 - remainder) !== Number(d[i])) return false;
  }
  return true;
}

export function validateManualReseller(body, normalizeEmail, isAdminEmail) {
  const name = text(body?.name, 120);
  const email = normalizeEmail(body?.email);
  const phone = digits(body?.phone);
  const cpfCnpj = digits(body?.cpfCnpj);
  const postalCode = digits(body?.postalCode);
  const street = text(body?.street, 220);
  const number = text(body?.number, 32);
  const complement = text(body?.complement, 160);
  const district = text(body?.district, 120);
  const city = text(body?.city, 120);
  const state = text(body?.state, 2).toUpperCase();
  if (name.length < 2 || name.length > 120) return {error:"Informe nome completo válido (2 a 120 caracteres)."};
  if (!email) return {error:"Informe um e-mail válido."};
  if (isAdminEmail(email)) return {error:"E-mail reservado ao administrador."};
  if (phone.length < 10 || phone.length > 15) return {error:"Informe WhatsApp válido com DDD."};
  if (!validCpfCnpj(cpfCnpj)) return {error:"Informe CPF ou CNPJ válido."};
  if (!/^\d{8}$/.test(postalCode)) return {error:"Informe CEP válido com oito dígitos."};
  if (!street || street.length > 220 || !number || number.length > 32 || complement.length > 160 || !district || district.length > 120 || !city || city.length > 120)
    return {error:"Preencha rua, número, bairro e cidade; confira os limites dos campos."};
  if (!STATES.has(state)) return {error:"Informe uma UF brasileira válida."};
  return {value:{name,email,phone,cpfCnpj,postalCode,street,number,complement,district,city,state}};
}
