/**
 * Shipping pricing zones configurations and CEP routing rules database.
 * 
 * IMPORTANT: 
 * - Rules are evaluated sequentially (first match wins). Specific city ranges must always be defined BEFORE broad catch-all fallbacks.
 * - Legacy fallback zones exist only to preserve compatibility and prevent price regressions. They represent legacy checkout rates, not official calibrated Correios prices.
 */

export const SHIPPING_ZONES = {
  // --- Calibrated Tiers (Target values minus R$ 0.70 packaging additions) ---
  ZONE_METRO_G1: { 
    name: "Grupo 1 - Metropolitana", 
    description: "Área metropolitana com menor tarifa cadastrada (PAC: 25.80, SEDEX: 27.60)", 
    economical: 25.80, 
    express: 27.60 
  },
  ZONE_INTERIOR_G2: { 
    name: "Grupo 2 - Interior Curto Alcance", 
    description: "Cidades do interior com tarifas próximas à origem (PAC: 29.80, SEDEX: 34.00)", 
    economical: 29.10, 
    express: 33.30 
  },
  ZONE_REGIONAL_CAPITALS_G3: { 
    name: "Grupo 3 - Capitais Regionais", 
    description: "Capitais estaduais de médio alcance logístico (PAC: 30.50, SEDEX: 46.80)", 
    economical: 29.80, 
    express: 46.10 
  },
  ZONE_INTERSTATE_G4: { 
    name: "Grupo 4 - Capitais Estaduais Específicas", 
    description: "Salvador e Cuiabá (PAC: 34.10, SEDEX: 65.00)", 
    economical: 33.40, 
    express: 64.30 
  },
  ZONE_INTERIOR_G5: { 
    name: "Grupo 5 - Interior Longo Alcance", 
    description: "Cidades do interior distantes do Sudeste/Sul (PAC: 36.00, SEDEX: 71.40)", 
    economical: 35.30, 
    express: 70.70 
  },
  ZONE_CAPITALS_G6: { 
    name: "Grupo 6 - Capitais Nordeste/Norte", 
    description: "Recife, Fortaleza, Belém, Palmas (PAC: 38.00, SEDEX: 83.60)", 
    economical: 37.30, 
    express: 82.90 
  },
  ZONE_LONG_DISTANCE_G7: { 
    name: "Grupo 7 - Capitais Distantes", 
    description: "Capitais estaduais de longo alcance logístico (PAC: 45.50, SEDEX: 97.30)", 
    economical: 44.80, 
    express: 96.60 
  },
  ZONE_MAX_DISTANCE_G8: { 
    name: "Grupo 8 - Longo Alcance Extremo", 
    description: "Rio Branco e Boa Vista (PAC: 54.70, SEDEX: 115.80)", 
    economical: 54.00, 
    express: 115.10 
  },
  ZONE_METRO_NATAL: { 
    name: "Grande Natal", 
    description: "Natal e Região Metropolitana (PAC: 45.50, SEDEX: 97.30)", 
    economical: 45.50, 
    express: 97.30 
  },
  ZONE_FALLBACK_RN: { 
    name: "Interior Rio Grande do Norte", 
    description: "Cidades do Interior do RN (PAC: 97.20, SEDEX: 127.40)", 
    economical: 97.20, 
    express: 127.40 
  },
  ZONE_BA_PROXIMO: { 
    name: "Grande Salvador e Polo BA", 
    description: "Salvador e municípios próximos (PAC: 34.10, SEDEX: 65.00)", 
    economical: 34.10, 
    express: 65.00 
  },
  ZONE_FALLBACK_BA: { 
    name: "Interior da Bahia", 
    description: "Cidades do Interior da BA (PAC: 43.40, SEDEX: 91.70)", 
    economical: 43.40, 
    express: 91.70 
  },
  ZONE_PE_METRO: { 
    name: "Região Metropolitana do Recife", 
    description: "Recife e municípios próximos (PAC: 38.00, SEDEX: 83.60)", 
    economical: 38.00, 
    express: 83.60 
  },
  ZONE_FALLBACK_PE: { 
    name: "Interior de Pernambuco", 
    description: "Cidades do Interior de PE (PAC: 71.00, SEDEX: 110.80)", 
    economical: 71.00, 
    express: 110.80 
  },
  ZONE_CE_METRO: { 
    name: "Região Metropolitana de Fortaleza", 
    description: "Fortaleza e municípios próximos (PAC: 38.00, SEDEX: 83.60)", 
    economical: 38.00, 
    express: 83.60 
  },
  ZONE_FALLBACK_CE: { 
    name: "Interior do Ceará", 
    description: "Cidades do Interior do CE (PAC: 71.00, SEDEX: 110.80)", 
    economical: 71.00, 
    express: 110.80 
  },
  ZONE_SE_METRO: { 
    name: "Região Metropolitana de Aracaju", 
    description: "Aracaju e municípios próximos (PAC: 45.50, SEDEX: 97.30)", 
    economical: 45.50, 
    express: 97.30 
  },
  ZONE_FALLBACK_SE: { 
    name: "Interior de Sergipe", 
    description: "Cidades do Interior de SE (PAC: 97.20, SEDEX: 127.40)", 
    economical: 97.20, 
    express: 127.40 
  },
  ZONE_AL_METRO: { 
    name: "Região Metropolitana de Maceió", 
    description: "Maceió e municípios próximos (PAC: 45.50, SEDEX: 97.30)", 
    economical: 45.50, 
    express: 97.30 
  },
  ZONE_FALLBACK_AL: { 
    name: "Interior de Alagoas", 
    description: "Cidades do Interior de AL (PAC: 97.20, SEDEX: 127.40)", 
    economical: 97.20, 
    express: 127.40 
  },
  ZONE_PB_METRO: { 
    name: "Região Metropolitana de João Pessoa", 
    description: "João Pessoa e municípios próximos (PAC: 45.50, SEDEX: 97.30)", 
    economical: 45.50, 
    express: 97.30 
  },
  ZONE_FALLBACK_PB: { 
    name: "Interior da Paraíba", 
    description: "Cidades do Interior da PB (PAC: 97.20, SEDEX: 127.40)", 
    economical: 97.20, 
    express: 127.40 
  },
  ZONE_PI_METRO: { 
    name: "Teresina e Adjacentes", 
    description: "Teresina e municípios próximos (PAC: 45.50, SEDEX: 97.30)", 
    economical: 45.50, 
    express: 97.30 
  },
  ZONE_FALLBACK_PI: { 
    name: "Interior do Piauí", 
    description: "Cidades do Interior do PI (PAC: 97.20, SEDEX: 127.40)", 
    economical: 97.20, 
    express: 127.40 
  },
  ZONE_MA_METRO: { 
    name: "Grande São Luís e Próximos", 
    description: "São Luís e municípios próximos (PAC: 45.50, SEDEX: 97.30)", 
    economical: 45.50, 
    express: 97.30 
  },
  ZONE_FALLBACK_MA: { 
    name: "Interior do Maranhão", 
    description: "Cidades do Interior do MA (PAC: 97.20, SEDEX: 127.40)", 
    economical: 97.20, 
    express: 127.40 
  },

  // --- NORTH REGION CALIBRATED ZONES ---
  ZONE_CAPITAL_AC: {
    name: "Rio Branco",
    description: "Rio Branco / AC (PAC: 54.70, SEDEX: 115.80)",
    economical: 54.70,
    express: 115.80
  },
  ZONE_FALLBACK_AC: {
    name: "Interior do Acre",
    description: "Cidades do Interior do AC (PAC: 115.30, SEDEX: 150.80)",
    economical: 115.30,
    express: 150.80
  },
  ZONE_METRO_AP: {
    name: "Grande Macapá",
    description: "Macapá, Santana e Mazagão (PAC: 45.50, SEDEX: 97.30)",
    economical: 45.50,
    express: 97.30
  },
  ZONE_FALLBACK_AP: {
    name: "Interior do Amapá",
    description: "Cidades do Interior do AP (PAC: 97.20, SEDEX: 127.40)",
    economical: 97.20,
    express: 127.40
  },
  ZONE_METRO_AM: {
    name: "Manaus e Iranduba",
    description: "Manaus e Iranduba / AM (PAC: 45.50, SEDEX: 97.30)",
    economical: 45.50,
    express: 97.30
  },
  ZONE_FALLBACK_AM: {
    name: "Interior do Amazonas",
    description: "Cidades do Interior do AM (PAC: 97.20, SEDEX: 127.40)",
    economical: 97.20,
    express: 127.40
  },
  ZONE_METRO_PA: {
    name: "Região Metropolitana de Belém",
    description: "Belém, Ananindeua, Marituba, Benevides e Santa Bárbara (PAC: 38.00, SEDEX: 83.60)",
    economical: 38.00,
    express: 83.60
  },
  ZONE_FALLBACK_PA: {
    name: "Interior do Pará",
    description: "Cidades do Interior do PA (PAC: 71.00, SEDEX: 110.80)",
    economical: 71.00,
    express: 110.80
  },
  ZONE_METRO_RO: {
    name: "Porto Velho e Candeias",
    description: "Porto Velho e Candeias do Jamari (PAC: 45.50, SEDEX: 97.30)",
    economical: 45.50,
    express: 97.30
  },
  ZONE_FALLBACK_RO: {
    name: "Interior de Rondônia",
    description: "Cidades do Interior de RO (PAC: 97.20, SEDEX: 127.40)",
    economical: 97.20,
    express: 127.40
  },
  ZONE_METRO_RR: {
    name: "Boa Vista e Adjacentes",
    description: "Boa Vista, Cantá e Mucajaí (PAC: 54.70, SEDEX: 115.80)",
    economical: 54.70,
    express: 115.80
  },
  ZONE_FALLBACK_RR: {
    name: "Interior de Roraima",
    description: "Cidades do Interior de RR (PAC: 115.30, SEDEX: 150.80)",
    economical: 115.30,
    express: 150.80
  },
  ZONE_METRO_TO: {
    name: "Palmas e Adjacentes",
    description: "Palmas, Porto Nacional e Lajeado (PAC: 38.00, SEDEX: 83.60)",
    economical: 38.00,
    express: 83.60
  },
  ZONE_FALLBACK_TO: {
    name: "Interior do Tocantins",
    description: "Cidades do Interior do TO (PAC: 71.00, SEDEX: 110.80)",
    economical: 71.00,
    express: 110.80
  },

  // --- CENTRO-OESTE REGION CALIBRATED ZONES ---
  ZONE_DF: {
    name: "Distrito Federal",
    description: "Distrito Federal (PAC: 30.50, SEDEX: 46.80)",
    economical: 30.50,
    express: 46.80
  },
  ZONE_GO_SPECIAL: {
    name: "Municípios com Tarifa Reduzida — Goiás",
    description: "Cidades especiais de GO (PAC: 30.50, SEDEX: 46.80)",
    economical: 30.50,
    express: 46.80
  },
  ZONE_FALLBACK_GO: {
    name: "Interior de Goiás",
    description: "Cidades do Interior de GO (PAC: 36.00, SEDEX: 71.40)",
    economical: 36.00,
    express: 71.40
  },
  ZONE_MT_METRO: {
    name: "Região Metropolitana de Cuiabá",
    description: "Cuiabá, Várzea Grande e Chapada dos Guimarães (PAC: 34.10, SEDEX: 65.00)",
    economical: 34.10,
    express: 65.00
  },
  ZONE_FALLBACK_MT: {
    name: "Interior de Mato Grosso",
    description: "Cidades do Interior de MT (PAC: 43.40, SEDEX: 91.70)",
    economical: 43.40,
    express: 91.70
  },
  ZONE_MS_CAMPO_GRANDE: {
    name: "Campo Grande",
    description: "Campo Grande / MS (PAC: 30.50, SEDEX: 46.80)",
    economical: 30.50,
    express: 46.80
  },
  ZONE_MS_INTERIOR: {
    name: "Interior de Mato Grosso do Sul",
    description: "Cidades do Interior de MS (PAC: 36.00, SEDEX: 71.40)",
    economical: 36.00,
    express: 71.40
  },

  // --- SOUTH REGION CALIBRATED ZONES ---
  ZONE_PR_METRO: {
    name: "Região Metropolitana de Curitiba (PR)",
    description: "Curitiba e municípios homologados (PAC: 30.50, SEDEX: 46.80)",
    economical: 30.50,
    express: 46.80
  },
  ZONE_FALLBACK_PR: {
    name: "Interior do Paraná",
    description: "Cidades do Interior do PR (PAC: 36.00, SEDEX: 71.40)",
    economical: 36.00,
    express: 71.40
  },
  ZONE_SC_FLORIPA: {
    name: "Grande Florianópolis (SC)",
    description: "Florianópolis e municípios homologados (PAC: 30.50, SEDEX: 46.80)",
    economical: 30.50,
    express: 46.80
  },
  ZONE_SC_ITAJAI: {
    name: "Itajaí (SC)",
    description: "Itajaí - SC (PAC: 35.50, SEDEX: 46.80)",
    economical: 35.50,
    express: 46.80
  },
  ZONE_FALLBACK_SC: {
    name: "Interior de Santa Catarina",
    description: "Cidades do Interior de SC (PAC: 36.00, SEDEX: 71.40)",
    economical: 36.00,
    express: 71.40
  },
  ZONE_RS_METRO: {
    name: "Região Metropolitana de Porto Alegre (RS)",
    description: "Porto Alegre e municípios homologados (PAC: 30.50, SEDEX: 46.80)",
    economical: 30.50,
    express: 46.80
  },
  ZONE_FALLBACK_RS: {
    name: "Interior do Rio Grande do Sul",
    description: "Cidades do Interior do RS (PAC: 36.00, SEDEX: 71.40)",
    economical: 36.00,
    express: 71.40
  },

  // --- SUDOESTE REGION CALIBRATED ZONES ---
  ZONE_SP_REDUCED: {
    name: "São Paulo Metropolitana e Polos",
    description: "São Paulo Capital e municípios paulistas homologados (PAC: 25.80, SEDEX: 27.60)",
    economical: 25.80,
    express: 27.60
  },
  ZONE_FALLBACK_SP: {
    name: "Interior de São Paulo",
    description: "Cidades do Interior de SP (PAC: 29.80, SEDEX: 34.00)",
    economical: 29.80,
    express: 34.00
  },
  ZONE_RJ_REDUCED: {
    name: "Região Metropolitana do Rio de Janeiro",
    description: "Rio de Janeiro Capital e municípios fluminenses homologados (PAC: 30.50, SEDEX: 46.80)",
    economical: 30.50,
    express: 46.80
  },
  ZONE_FALLBACK_RJ: {
    name: "Interior do Rio de Janeiro",
    description: "Cidades do Interior do RJ (PAC: 36.00, SEDEX: 71.40)",
    economical: 36.00,
    express: 71.40
  },
  ZONE_ES_REDUCED: {
    name: "Região Metropolitana de Vitória",
    description: "Vitória e municípios capixabas homologados (PAC: 30.50, SEDEX: 46.80)",
    economical: 30.50,
    express: 46.80
  },
  ZONE_FALLBACK_ES: {
    name: "Interior do Espírito Santo",
    description: "Cidades do Interior do ES (PAC: 36.00, SEDEX: 71.40)",
    economical: 36.00,
    express: 71.40
  },
  ZONE_MG_METRO: {
    name: "Região Metropolitana de Belo Horizonte",
    description: "Belo Horizonte e municípios mineiros homologados (PAC: 30.50, SEDEX: 46.80)",
    economical: 30.50,
    express: 46.80
  },
  ZONE_MG_EXTREMA: {
    name: "Ponto Especial - Extrema (MG)",
    description: "Município de Extrema (PAC: 30.50, SEDEX: 46.80)",
    economical: 30.50,
    express: 46.80
  },
  ZONE_MG_SUL_SPECIAL: {
    name: "Sul de Minas Especial",
    description: "Polos homologados do Sul de Minas (PAC: 29.80, SEDEX: 34.00)",
    economical: 29.80,
    express: 34.00
  },
  ZONE_FALLBACK_MG: {
    name: "Interior de Minas Gerais",
    description: "Cidades do Interior de MG (PAC: 36.00, SEDEX: 71.40)",
    economical: 36.00,
    express: 71.40
  },
} as const;

export const CEP_ROUTING_RULES = [





  // --- NORTHEAST REGION CUSTOM CALIBRATED RULES (State by State) ---
  
  // 1. Bahia (BA)
  { cepStart: 40000000, cepEnd: 41999999, zoneId: "ZONE_BA_PROXIMO", description: "Salvador" },
  { cepStart: 42700000, cepEnd: 42749999, zoneId: "ZONE_BA_PROXIMO", description: "Lauro de Freitas" },
  { cepStart: 42800000, cepEnd: 42849999, zoneId: "ZONE_BA_PROXIMO", description: "Camaçari" },
  { cepStart: 43700000, cepEnd: 43799999, zoneId: "ZONE_BA_PROXIMO", description: "Simões Filho" },
  { cepStart: 43800000, cepEnd: 43849999, zoneId: "ZONE_BA_PROXIMO", description: "Candeias" },
  { cepStart: 44000000, cepEnd: 44149999, zoneId: "ZONE_BA_PROXIMO", description: "Feira de Santana" },
  { cepStart: 40000000, cepEnd: 48999999, zoneId: "ZONE_FALLBACK_BA", description: "Fallback Interior BA" },

  // 2. Sergipe (SE)
  { cepStart: 49000000, cepEnd: 49099999, zoneId: "ZONE_SE_METRO", description: "Aracaju" },
  { cepStart: 49100000, cepEnd: 49129999, zoneId: "ZONE_SE_METRO", description: "São Cristóvão" },
  { cepStart: 49140000, cepEnd: 49149999, zoneId: "ZONE_SE_METRO", description: "Barra dos Coqueiros" },
  { cepStart: 49160000, cepEnd: 49169999, zoneId: "ZONE_SE_METRO", description: "Nossa Senhora do Socorro" },
  { cepStart: 49000000, cepEnd: 49999999, zoneId: "ZONE_FALLBACK_SE", description: "Fallback Interior SE" },

  // 3. Pernambuco (PE)
  { cepStart: 50000000, cepEnd: 52999999, zoneId: "ZONE_PE_METRO", description: "Recife" },
  { cepStart: 53000000, cepEnd: 53399999, zoneId: "ZONE_PE_METRO", description: "Olinda" },
  { cepStart: 53400000, cepEnd: 53499999, zoneId: "ZONE_PE_METRO", description: "Paulista" },
  { cepStart: 54000000, cepEnd: 54499999, zoneId: "ZONE_PE_METRO", description: "Jaboatão dos Guararapes" },
  { cepStart: 54500000, cepEnd: 54599999, zoneId: "ZONE_PE_METRO", description: "Cabo de Santo Agostinho" },
  { cepStart: 54750000, cepEnd: 54799999, zoneId: "ZONE_PE_METRO", description: "Camaragibe" },
  { cepStart: 50000000, cepEnd: 56999999, zoneId: "ZONE_FALLBACK_PE", description: "Fallback Interior PE" },

  // 4. Alagoas (AL)
  { cepStart: 57000000, cepEnd: 57099999, zoneId: "ZONE_AL_METRO", description: "Maceió" },
  { cepStart: 57100000, cepEnd: 57109999, zoneId: "ZONE_AL_METRO", description: "Rio Largo" },
  { cepStart: 57120000, cepEnd: 57129999, zoneId: "ZONE_AL_METRO", description: "Satuba" },
  { cepStart: 57160000, cepEnd: 57169999, zoneId: "ZONE_AL_METRO", description: "Marechal Deodoro" },
  { cepStart: 57000000, cepEnd: 57999999, zoneId: "ZONE_FALLBACK_AL", description: "Fallback Interior AL" },

  // 5. Paraíba (PB)
  { cepStart: 58000000, cepEnd: 58099999, zoneId: "ZONE_PB_METRO", description: "João Pessoa" },
  { cepStart: 58100000, cepEnd: 58109999, zoneId: "ZONE_PB_METRO", description: "Cabedelo" },
  { cepStart: 58110000, cepEnd: 58114999, zoneId: "ZONE_PB_METRO", description: "Bayeux" },
  { cepStart: 58300000, cepEnd: 58304999, zoneId: "ZONE_PB_METRO", description: "Santa Rita" },
  { cepStart: 58000000, cepEnd: 58999999, zoneId: "ZONE_FALLBACK_PB", description: "Fallback Interior PB" },

  // 6. Rio Grande do Norte (RN)
  { cepStart: 59000000, cepEnd: 59159999, zoneId: "ZONE_METRO_NATAL", description: "Natal e Parnamirim" },
  { cepStart: 59280000, cepEnd: 59289999, zoneId: "ZONE_METRO_NATAL", description: "Macaíba" },
  { cepStart: 59290000, cepEnd: 59299999, zoneId: "ZONE_METRO_NATAL", description: "São Gonçalo do Amarante" },
  { cepStart: 59000000, cepEnd: 59999999, zoneId: "ZONE_FALLBACK_RN", description: "Fallback Interior RN" },

  // 7. Ceará (CE)
  { cepStart: 60000000, cepEnd: 61599999, zoneId: "ZONE_CE_METRO", description: "Fortaleza" },
  { cepStart: 61600000, cepEnd: 61699999, zoneId: "ZONE_CE_METRO", description: "Caucaia" },
  { cepStart: 61700000, cepEnd: 61759999, zoneId: "ZONE_CE_METRO", description: "Aquiraz" },
  { cepStart: 61760000, cepEnd: 61799999, zoneId: "ZONE_CE_METRO", description: "Eusébio" },
  { cepStart: 61900000, cepEnd: 61939999, zoneId: "ZONE_CE_METRO", description: "Maracanaú" },
  { cepStart: 60000000, cepEnd: 63999999, zoneId: "ZONE_FALLBACK_CE", description: "Fallback Interior CE" },

  // 8. Piauí (PI)
  { cepStart: 64000000, cepEnd: 64099999, zoneId: "ZONE_PI_METRO", description: "Teresina" },
  { cepStart: 64110000, cepEnd: 64119999, zoneId: "ZONE_PI_METRO", description: "José de Freitas" },
  { cepStart: 64290000, cepEnd: 64294999, zoneId: "ZONE_PI_METRO", description: "Altos" },
  { cepStart: 64390000, cepEnd: 64394999, zoneId: "ZONE_PI_METRO", description: "Demerval Lobão" },
  { cepStart: 64000000, cepEnd: 64999999, zoneId: "ZONE_FALLBACK_PI", description: "Fallback Interior PI" },

  // 9. Maranhão (MA)
  { cepStart: 65000000, cepEnd: 65139999, zoneId: "ZONE_MA_METRO", description: "São Luís, Ribamar, Paço e Raposa" },
  { cepStart: 65150000, cepEnd: 65152999, zoneId: "ZONE_MA_METRO", description: "Rosário" },
  { cepStart: 65000000, cepEnd: 65999999, zoneId: "ZONE_FALLBACK_MA", description: "Fallback Interior MA" },

  // --- NORTH REGION CUSTOM CALIBRATED RULES (State by State) ---

  // 1. Tocantins (TO)
  { cepStart: 77000000, cepEnd: 77299999, zoneId: "ZONE_METRO_TO", description: "Palmas" },
  { cepStart: 77500000, cepEnd: 77552999, zoneId: "ZONE_METRO_TO", description: "Porto Nacional" },
  { cepStart: 77645000, cepEnd: 77645000, zoneId: "ZONE_METRO_TO", description: "Lajeado" },
  { cepStart: 77000000, cepEnd: 77999999, zoneId: "ZONE_FALLBACK_TO", description: "Fallback Interior TO" },

  // 2. Rondônia (RO)
  { cepStart: 76800000, cepEnd: 76849999, zoneId: "ZONE_METRO_RO", description: "Porto Velho" },
  { cepStart: 76860000, cepEnd: 76860000, zoneId: "ZONE_METRO_RO", description: "Candeias do Jamari" },
  { cepStart: 76800000, cepEnd: 76999999, zoneId: "ZONE_FALLBACK_RO", description: "Fallback Interior RO" },

  // 3. Pará (PA)
  { cepStart: 66000000, cepEnd: 66999999, zoneId: "ZONE_METRO_PA", description: "Belém" },
  { cepStart: 67000000, cepEnd: 67199999, zoneId: "ZONE_METRO_PA", description: "Ananindeua" },
  { cepStart: 67200000, cepEnd: 67999999, zoneId: "ZONE_METRO_PA", description: "Marituba" },
  { cepStart: 68795000, cepEnd: 68797999, zoneId: "ZONE_METRO_PA", description: "Benevides" },
  { cepStart: 68798000, cepEnd: 68799999, zoneId: "ZONE_METRO_PA", description: "Santa Bárbara do Pará" },
  { cepStart: 68000000, cepEnd: 68899999, zoneId: "ZONE_FALLBACK_PA", description: "Fallback Interior PA" },

  // 4. Amapá (AP)
  { cepStart: 68900000, cepEnd: 68911999, zoneId: "ZONE_METRO_AP", description: "Macapá" },
  { cepStart: 68925000, cepEnd: 68939999, zoneId: "ZONE_METRO_AP", description: "Santana" },
  { cepStart: 68940000, cepEnd: 68940000, zoneId: "ZONE_METRO_AP", description: "Mazagão" },
  { cepStart: 68900000, cepEnd: 68999999, zoneId: "ZONE_FALLBACK_AP", description: "Fallback Interior AP" },

  // 5. Amazonas (AM) / Roraima (RR)
  { cepStart: 69000000, cepEnd: 69099999, zoneId: "ZONE_METRO_AM", description: "Manaus" },
  { cepStart: 69415000, cepEnd: 69415000, zoneId: "ZONE_METRO_AM", description: "Iranduba" },
  { cepStart: 69000000, cepEnd: 69299999, zoneId: "ZONE_FALLBACK_AM", description: "Fallback Interior AM Ocidental" },
  { cepStart: 69300000, cepEnd: 69339999, zoneId: "ZONE_METRO_RR", description: "Boa Vista" },
  { cepStart: 69340000, cepEnd: 69340000, zoneId: "ZONE_METRO_RR", description: "Mucajaí" },
  { cepStart: 69390000, cepEnd: 69390000, zoneId: "ZONE_METRO_RR", description: "Cantá" },
  { cepStart: 69300000, cepEnd: 69399999, zoneId: "ZONE_FALLBACK_RR", description: "Fallback Interior RR" },
  { cepStart: 69400000, cepEnd: 69899999, zoneId: "ZONE_FALLBACK_AM", description: "Fallback Interior AM Oriental" },

  // 6. Acre (AC)
  { cepStart: 69900000, cepEnd: 69923999, zoneId: "ZONE_CAPITAL_AC", description: "Rio Branco" },
  { cepStart: 69900000, cepEnd: 69999999, zoneId: "ZONE_FALLBACK_AC", description: "Fallback Interior AC" },

  // --- CENTRO-OESTE REGION CUSTOM CALIBRATED RULES (State by State) ---

  // 1. Goiás (GO) / Distrito Federal (DF)
  { cepStart: 74000000, cepEnd: 74899999, zoneId: "ZONE_GO_SPECIAL", description: "Goiânia" },
  { cepStart: 74900000, cepEnd: 74999999, zoneId: "ZONE_GO_SPECIAL", description: "Aparecida de Goiânia" },
  { cepStart: 75250000, cepEnd: 75264999, zoneId: "ZONE_GO_SPECIAL", description: "Senador Canedo" },
  { cepStart: 75380000, cepEnd: 75394999, zoneId: "ZONE_GO_SPECIAL", description: "Trindade" },
  { cepStart: 75000000, cepEnd: 75159999, zoneId: "ZONE_GO_SPECIAL", description: "Anápolis" },
  { cepStart: 72800000, cepEnd: 72859999, zoneId: "ZONE_GO_SPECIAL", description: "Luziânia" },
  { cepStart: 75360000, cepEnd: 75374999, zoneId: "ZONE_GO_SPECIAL", description: "Goianira" },
  { cepStart: 75460000, cepEnd: 75469999, zoneId: "ZONE_GO_SPECIAL", description: "Nerópolis" },
  { cepStart: 75340000, cepEnd: 75344999, zoneId: "ZONE_GO_SPECIAL", description: "Hidrolândia" },
  { cepStart: 72900000, cepEnd: 72909999, zoneId: "ZONE_GO_SPECIAL", description: "Santo Antônio do Descoberto" },
  { cepStart: 70000000, cepEnd: 72799999, zoneId: "ZONE_DF", description: "Distrito Federal Faixa 1" },
  { cepStart: 72800000, cepEnd: 72999999, zoneId: "ZONE_FALLBACK_GO", description: "Fallback Interior GO Entorno" },
  { cepStart: 73000000, cepEnd: 73699999, zoneId: "ZONE_DF", description: "Distrito Federal Faixa 2" },
  { cepStart: 73700000, cepEnd: 76799999, zoneId: "ZONE_FALLBACK_GO", description: "Fallback Interior GO" },

  // 2. Mato Grosso (MT) / Rondônia (RO) / Mato Grosso do Sul (MS)
  { cepStart: 78000000, cepEnd: 78109999, zoneId: "ZONE_MT_METRO", description: "Cuiabá" },
  { cepStart: 78110000, cepEnd: 78169999, zoneId: "ZONE_MT_METRO", description: "Várzea Grande" },
  { cepStart: 78195000, cepEnd: 78199999, zoneId: "ZONE_MT_METRO", description: "Chapada dos Guimarães" },
  { cepStart: 78000000, cepEnd: 78899999, zoneId: "ZONE_FALLBACK_MT", description: "Fallback Interior MT" },
  { cepStart: 78900000, cepEnd: 78999999, zoneId: "ZONE_FALLBACK_RO", description: "Fallback Interior RO Descontínuo" },
  { cepStart: 79000000, cepEnd: 79124999, zoneId: "ZONE_MS_CAMPO_GRANDE", description: "Campo Grande" },
  { cepStart: 79000000, cepEnd: 79999999, zoneId: "ZONE_MS_INTERIOR", description: "Fallback Interior MS" },

  // --- SOUTH REGION CUSTOM CALIBRATED RULES (State by State) ---
  
  // 1. Paraná (PR)
  { cepStart: 80000000, cepEnd: 82999999, zoneId: "ZONE_PR_METRO", description: "Curitiba" },
  { cepStart: 83000000, cepEnd: 83189999, zoneId: "ZONE_PR_METRO", description: "São José dos Pinhais" },
  { cepStart: 83300000, cepEnd: 83319999, zoneId: "ZONE_PR_METRO", description: "Piraquara" },
  { cepStart: 83320000, cepEnd: 83339999, zoneId: "ZONE_PR_METRO", description: "Pinhais" },
  { cepStart: 83400000, cepEnd: 83419999, zoneId: "ZONE_PR_METRO", description: "Colombo" },
  { cepStart: 83500000, cepEnd: 83519999, zoneId: "ZONE_PR_METRO", description: "Almirante Tamandaré" },
  { cepStart: 83600000, cepEnd: 83649999, zoneId: "ZONE_PR_METRO", description: "Campo Largo" },
  { cepStart: 83700000, cepEnd: 83729999, zoneId: "ZONE_PR_METRO", description: "Araucária" },
  { cepStart: 80000000, cepEnd: 87999999, zoneId: "ZONE_FALLBACK_PR", description: "Fallback Interior PR" },

  // 2. Santa Catarina (SC)
  { cepStart: 88000000, cepEnd: 88099999, zoneId: "ZONE_SC_FLORIPA", description: "Florianópolis" },
  { cepStart: 88100000, cepEnd: 88129999, zoneId: "ZONE_SC_FLORIPA", description: "São José" },
  { cepStart: 88130000, cepEnd: 88139999, zoneId: "ZONE_SC_FLORIPA", description: "Palhoça" },
  { cepStart: 88160000, cepEnd: 88169999, zoneId: "ZONE_SC_FLORIPA", description: "Biguaçu" },
  { cepStart: 88300000, cepEnd: 88319999, zoneId: "ZONE_SC_ITAJAI", description: "Itajaí" },
  { cepStart: 88000000, cepEnd: 89999999, zoneId: "ZONE_FALLBACK_SC", description: "Fallback Interior SC" },

  // 3. Rio Grande do Sul (RS)
  { cepStart: 90000000, cepEnd: 91999999, zoneId: "ZONE_RS_METRO", description: "Porto Alegre" },
  { cepStart: 92000000, cepEnd: 92499999, zoneId: "ZONE_RS_METRO", description: "Canoas" },
  { cepStart: 93000000, cepEnd: 93179999, zoneId: "ZONE_RS_METRO", description: "São Leopoldo" },
  { cepStart: 93200000, cepEnd: 93249999, zoneId: "ZONE_RS_METRO", description: "Sapucaia do Sul" },
  { cepStart: 93250000, cepEnd: 93299999, zoneId: "ZONE_RS_METRO", description: "Esteio" },
  { cepStart: 93300000, cepEnd: 93599999, zoneId: "ZONE_RS_METRO", description: "Novo Hamburgo" },
  { cepStart: 94000000, cepEnd: 94299999, zoneId: "ZONE_RS_METRO", description: "Gravataí" },
  { cepStart: 94800000, cepEnd: 94899999, zoneId: "ZONE_RS_METRO", description: "Alvorada" },
  { cepStart: 94900000, cepEnd: 94999999, zoneId: "ZONE_RS_METRO", description: "Cachoeirinha" },
  { cepStart: 90000000, cepEnd: 99999999, zoneId: "ZONE_FALLBACK_RS", description: "Fallback Interior RS" },

  // --- 1. SÃO PAULO (SP) ---
  { cepStart: 1000000, cepEnd: 5999999, zoneId: "ZONE_SP_REDUCED", description: "São Paulo Capital Parte 1" },
  { cepStart: 8000000, cepEnd: 8499999, zoneId: "ZONE_SP_REDUCED", description: "São Paulo Capital Parte 2 (Zona Leste)" },
  { cepStart: 6000000, cepEnd: 6299999, zoneId: "ZONE_SP_REDUCED", description: "Osasco" },
  { cepStart: 6400000, cepEnd: 6499999, zoneId: "ZONE_SP_REDUCED", description: "Barueri" },
  { cepStart: 6650000, cepEnd: 6699999, zoneId: "ZONE_SP_REDUCED", description: "Itapevi" },
  { cepStart: 6700000, cepEnd: 6729999, zoneId: "ZONE_SP_REDUCED", description: "Cotia" },
  { cepStart: 7000000, cepEnd: 7399999, zoneId: "ZONE_SP_REDUCED", description: "Guarulhos" },
  { cepStart: 7750000, cepEnd: 7799999, zoneId: "ZONE_SP_REDUCED", description: "Cajamar" },
  { cepStart: 8700000, cepEnd: 8899999, zoneId: "ZONE_SP_REDUCED", description: "Mogi das Cruzes" },
  { cepStart: 9000000, cepEnd: 9299999, zoneId: "ZONE_SP_REDUCED", description: "Santo André" },
  { cepStart: 9300000, cepEnd: 9399999, zoneId: "ZONE_SP_REDUCED", description: "Mauá" },
  { cepStart: 9500000, cepEnd: 9599999, zoneId: "ZONE_SP_REDUCED", description: "São Caetano do Sul" },
  { cepStart: 9600000, cepEnd: 9899999, zoneId: "ZONE_SP_REDUCED", description: "São Bernardo do Campo" },
  { cepStart: 9900000, cepEnd: 9999999, zoneId: "ZONE_SP_REDUCED", description: "Diadema" },
  { cepStart: 11000000, cepEnd: 11249999, zoneId: "ZONE_SP_REDUCED", description: "Santos" },
  { cepStart: 11300000, cepEnd: 11399999, zoneId: "ZONE_SP_REDUCED", description: "São Vicente" },
  { cepStart: 11500000, cepEnd: 11599999, zoneId: "ZONE_SP_REDUCED", description: "Cubatão" },
  { cepStart: 11700000, cepEnd: 11729999, zoneId: "ZONE_SP_REDUCED", description: "Praia Grande" },
  { cepStart: 12200000, cepEnd: 12249999, zoneId: "ZONE_SP_REDUCED", description: "São José dos Campos" },
  { cepStart: 12300000, cepEnd: 12349999, zoneId: "ZONE_SP_REDUCED", description: "Jacareí" },
  { cepStart: 12940000, cepEnd: 12954999, zoneId: "ZONE_SP_REDUCED", description: "Atibaia" },
  { cepStart: 13000000, cepEnd: 13139999, zoneId: "ZONE_SP_REDUCED", description: "Campinas" },
  { cepStart: 13140000, cepEnd: 13149999, zoneId: "ZONE_SP_REDUCED", description: "Paulínia" },
  { cepStart: 13183000, cepEnd: 13189999, zoneId: "ZONE_SP_REDUCED", description: "Hortolândia" },
  { cepStart: 13200000, cepEnd: 13219999, zoneId: "ZONE_SP_REDUCED", description: "Jundiaí" },
  { cepStart: 13270000, cepEnd: 13279999, zoneId: "ZONE_SP_REDUCED", description: "Valinhos" },
  { cepStart: 13280000, cepEnd: 13289999, zoneId: "ZONE_SP_REDUCED", description: "Vinhedo" },
  { cepStart: 13290000, cepEnd: 13294999, zoneId: "ZONE_SP_REDUCED", description: "Louveira" },
  { cepStart: 13300000, cepEnd: 13319999, zoneId: "ZONE_SP_REDUCED", description: "Itu" },
  { cepStart: 13320000, cepEnd: 13329999, zoneId: "ZONE_SP_REDUCED", description: "Salto" },
  { cepStart: 13400000, cepEnd: 13439999, zoneId: "ZONE_SP_REDUCED", description: "Piracicaba" },
  { cepStart: 13465000, cepEnd: 13479999, zoneId: "ZONE_SP_REDUCED", description: "Americana" },
  { cepStart: 13480000, cepEnd: 13489999, zoneId: "ZONE_SP_REDUCED", description: "Limeira" },
  { cepStart: 18000000, cepEnd: 18109999, zoneId: "ZONE_SP_REDUCED", description: "Sorocaba" },
  { cepStart: 18110000, cepEnd: 18119999, zoneId: "ZONE_SP_REDUCED", description: "Votorantim" },
  { cepStart: 1000000, cepEnd: 19999999, zoneId: "ZONE_FALLBACK_SP", description: "Fallback Interior SP" },

  // --- 2. RIO DE JANEIRO (RJ) ---
  { cepStart: 20000000, cepEnd: 23799999, zoneId: "ZONE_RJ_REDUCED", description: "Rio de Janeiro Capital" },
  { cepStart: 24000000, cepEnd: 24399999, zoneId: "ZONE_RJ_REDUCED", description: "Niterói" },
  { cepStart: 24400000, cepEnd: 24799999, zoneId: "ZONE_RJ_REDUCED", description: "São Gonçalo" },
  { cepStart: 24800000, cepEnd: 24899999, zoneId: "ZONE_RJ_REDUCED", description: "Itaboraí" },
  { cepStart: 24900000, cepEnd: 24999999, zoneId: "ZONE_RJ_REDUCED", description: "Maricá" },
  { cepStart: 25000000, cepEnd: 25299999, zoneId: "ZONE_RJ_REDUCED", description: "Duque de Caxias" },
  { cepStart: 25500000, cepEnd: 25599999, zoneId: "ZONE_RJ_REDUCED", description: "São João de Meriti" },
  { cepStart: 25600000, cepEnd: 25779999, zoneId: "ZONE_RJ_REDUCED", description: "Petrópolis" },
  { cepStart: 25900000, cepEnd: 25939999, zoneId: "ZONE_RJ_REDUCED", description: "Magé" },
  { cepStart: 25940000, cepEnd: 25949999, zoneId: "ZONE_RJ_REDUCED", description: "Guapimirim" },
  { cepStart: 25950000, cepEnd: 25999999, zoneId: "ZONE_RJ_REDUCED", description: "Teresópolis" },
  { cepStart: 26000000, cepEnd: 26099999, zoneId: "ZONE_RJ_REDUCED", description: "Nova Iguaçu Parte 1" },
  { cepStart: 26200000, cepEnd: 26299999, zoneId: "ZONE_RJ_REDUCED", description: "Nova Iguaçu Parte 2" },
  { cepStart: 26100000, cepEnd: 26199999, zoneId: "ZONE_RJ_REDUCED", description: "Belford Roxo" },
  { cepStart: 26300000, cepEnd: 26399999, zoneId: "ZONE_RJ_REDUCED", description: "Queimados" },
  { cepStart: 26500000, cepEnd: 26549999, zoneId: "ZONE_RJ_REDUCED", description: "Nilópolis" },
  { cepStart: 26550000, cepEnd: 26599999, zoneId: "ZONE_RJ_REDUCED", description: "Mesquita" },
  { cepStart: 20000000, cepEnd: 28999999, zoneId: "ZONE_FALLBACK_RJ", description: "Fallback Interior RJ" },

  // --- 3. ESPÍRITO SANTO (ES) ---
  { cepStart: 29000000, cepEnd: 29099999, zoneId: "ZONE_ES_REDUCED", description: "Vitória" },
  { cepStart: 29100000, cepEnd: 29129999, zoneId: "ZONE_ES_REDUCED", description: "Vila Velha" },
  { cepStart: 29130000, cepEnd: 29139999, zoneId: "ZONE_ES_REDUCED", description: "Viana" },
  { cepStart: 29140000, cepEnd: 29159999, zoneId: "ZONE_ES_REDUCED", description: "Cariacica" },
  { cepStart: 29160000, cepEnd: 29184999, zoneId: "ZONE_ES_REDUCED", description: "Serra" },
  { cepStart: 29185000, cepEnd: 29189999, zoneId: "ZONE_ES_REDUCED", description: "Fundão" },
  { cepStart: 29200000, cepEnd: 29229999, zoneId: "ZONE_ES_REDUCED", description: "Guarapari" },
  { cepStart: 29000000, cepEnd: 29999999, zoneId: "ZONE_FALLBACK_ES", description: "Fallback Interior ES" },

  // --- 4. MINAS GERAIS (MG) ---
  { cepStart: 30000000, cepEnd: 31999999, zoneId: "ZONE_MG_METRO", description: "Belo Horizonte" },
  { cepStart: 32000000, cepEnd: 32399999, zoneId: "ZONE_MG_METRO", description: "Contagem" },
  { cepStart: 32400000, cepEnd: 32449999, zoneId: "ZONE_MG_METRO", description: "Ibirité" },
  { cepStart: 32600000, cepEnd: 32699999, zoneId: "ZONE_MG_METRO", description: "Betim" },
  { cepStart: 33000000, cepEnd: 33199999, zoneId: "ZONE_MG_METRO", description: "Santa Luzia" },
  { cepStart: 33200000, cepEnd: 33229999, zoneId: "ZONE_MG_METRO", description: "Vespasiano" },
  { cepStart: 33230000, cepEnd: 33249999, zoneId: "ZONE_MG_METRO", description: "Lagoa Santa" },
  { cepStart: 33800000, cepEnd: 33979999, zoneId: "ZONE_MG_METRO", description: "Ribeirão das Neves" },
  { cepStart: 34000000, cepEnd: 34019999, zoneId: "ZONE_MG_METRO", description: "Nova Lima" },
  { cepStart: 34500000, cepEnd: 34799999, zoneId: "ZONE_MG_METRO", description: "Sabará" },
  { cepStart: 35460000, cepEnd: 35469999, zoneId: "ZONE_MG_METRO", description: "Brumadinho" },
  { cepStart: 37640000, cepEnd: 37649999, zoneId: "ZONE_MG_EXTREMA", description: "Extrema" },
  { cepStart: 37700000, cepEnd: 37719999, zoneId: "ZONE_MG_SUL_SPECIAL", description: "Poços de Caldas" },
  { cepStart: 37549000, cepEnd: 37562999, zoneId: "ZONE_MG_SUL_SPECIAL", description: "Pouso Alegre" },
  { cepStart: 37500000, cepEnd: 37507999, zoneId: "ZONE_MG_SUL_SPECIAL", description: "Itajubá" },
  { cepStart: 37536000, cepEnd: 37541999, zoneId: "ZONE_MG_SUL_SPECIAL", description: "Santa Rita do Sapucaí" },
  { cepStart: 30000000, cepEnd: 39999999, zoneId: "ZONE_FALLBACK_MG", description: "Fallback Interior MG" }
] as const;

export interface ShippingRegion {
  region: string;
  cepStart: number;
  cepEnd: number;
  economical: number;
  express: number;
}

// Generate the flat backward-compatible array mapping the priority rules to zones
export const shippingRegions: readonly ShippingRegion[] = Object.freeze(
  CEP_ROUTING_RULES.map((rule) => {
    const zone = SHIPPING_ZONES[rule.zoneId as keyof typeof SHIPPING_ZONES];
    return {
      region: `${zone.name} - ${rule.description}`,
      cepStart: rule.cepStart,
      cepEnd: rule.cepEnd,
      economical: zone.economical,
      express: zone.express
    };
  })
);
