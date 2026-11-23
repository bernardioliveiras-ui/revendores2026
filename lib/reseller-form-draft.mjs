/** CEP is advisory: partial provider data must not erase what the BKO typed. */
export function applyPostalAddress(draft, address) {
  const patch = {};
  for (const key of ["street","district","city","state"])
    if (typeof address?.[key] === "string" && address[key].trim()) patch[key] = address[key].trim();
  return {...draft,...patch};
}
