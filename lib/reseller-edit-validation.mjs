/** Campos que o BKO pode alterar sem mexer em pedidos/estoque histórico. */
export function validateResellerEdit(data, normalizeEmail, isAdminEmail) {
  const name = typeof data?.name === 'string' ? data.name.trim().replace(/\s+/g, ' ') : '';
  const email = normalizeEmail(data?.email);
  const phone = typeof data?.phone === 'string' ? data.phone.replace(/\D/g, '') : '';
  if (name.length < 2 || name.length > 120) return {error:'Informe o nome do revendedor (2 a 120 caracteres).'};
  if (!email) return {error:'Informe um e-mail válido.'};
  if (isAdminEmail(email)) return {error:'E-mail reservado ao ADMIN. Escolha outro endereço.'};
  if (phone.length < 10 || phone.length > 15) return {error:'Informe um telefone válido com DDD (10 a 15 dígitos).'};
  return {value:{name,email,phone}};
}
