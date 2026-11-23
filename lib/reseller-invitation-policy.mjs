export function canIssueManualResellerInvitation(user, profile) {
  return Boolean(user?.id && user.role === "reseller" && user.status === "active" &&
    profile?.userId === user.id && profile.purchaseId === null);
}

export function isUsableManualResellerInvitation(invite, user, profile, now) {
  return Boolean(invite && !invite.usedAt && typeof invite.expiresAt === "string" && invite.expiresAt > now &&
    canIssueManualResellerInvitation(user, profile));
}

export function validateManualResellerActivation(body) {
  const token = typeof body?.token === "string" ? body.token : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const confirm = typeof body?.confirm === "string" ? body.confirm : "";
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return {error:"Convite inválido ou expirado."};
  if (password.length < 10 || password.length > 256 || password !== confirm)
    return {error:"A senha precisa ter entre 10 e 256 caracteres e ser confirmada."};
  return {value:{token,password}};
}
