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

  // --- Original Legacy Fallback Tiers (Preserves original database rates and ranges) ---
  // Note: The fallbacks below exist only to preserve compatibility and prevent price regressions. 
  // They represent legacy checkout rates, not official calibrated Correios prices.
  ZONE_FALLBACK_SP_CAPITAL: { 
    name: "Legacy Fallback SP Capital", 
    description: "Preços legados SP Capital (PAC: 25.80, SEDEX: 27.60)", 
    economical: 25.80, 
    express: 27.60 
  },
  ZONE_FALLBACK_SP_INTERIOR: { 
    name: "Legacy Fallback SP Interior", 
    description: "Preços legados SP Interior (PAC: 16.90, SEDEX: 26.90)", 
    economical: 16.90, 
    express: 26.90 
  },
  ZONE_FALLBACK_RJ_ES_MG: { 
    name: "Legacy Fallback RJ / ES / MG", 
    description: "Preços legados RJ/ES/MG (PAC: 18.90, SEDEX: 29.90)", 
    economical: 18.90, 
    express: 29.90 
  },

  ZONE_FALLBACK_NORTE: { 
    name: "Legacy Fallback Norte", 
    description: "Preços legados Norte (PAC: 32.90, SEDEX: 49.90)", 
    economical: 32.90, 
    express: 49.90 
  },
  ZONE_FALLBACK_CENTRO_OESTE: { 
    name: "Legacy Fallback Centro Oeste", 
    description: "Preços legados Centro-Oeste (PAC: 22.90, SEDEX: 36.90)", 
    economical: 22.90, 
    express: 36.90 
  },
  ZONE_FALLBACK_SUL: { 
    name: "Legacy Fallback Sul", 
    description: "Preços legados Sul (PAC: 19.90, SEDEX: 31.90)", 
    economical: 19.90, 
    express: 31.90 
  }
} as const;

export const CEP_ROUTING_RULES = [
  // --- ZONE_METRO_G1 Specific Cities ---
  { cepStart: 1000000, cepEnd: 9999999, zoneId: "ZONE_METRO_G1", description: "Grande São Paulo" }, // São Paulo Capital e Região Metropolitana (DDD 11)
  { cepStart: 11000000, cepEnd: 11249999, zoneId: "ZONE_METRO_G1", description: "Santos" }, // baseado nos CEPs oficiais do município
  { cepStart: 13000000, cepEnd: 13139999, zoneId: "ZONE_METRO_G1", description: "Campinas" }, // baseado nos CEPs oficiais do município
  { cepStart: 18000000, cepEnd: 18109999, zoneId: "ZONE_METRO_G1", description: "Sorocaba" }, // baseado nos CEPs oficiais do município
  { cepStart: 12200000, cepEnd: 12249999, zoneId: "ZONE_METRO_G1", description: "São José dos Campos" }, // baseado nos CEPs oficiais do município
  { cepStart: 13400000, cepEnd: 13439999, zoneId: "ZONE_METRO_G1", description: "Piracicaba" }, // baseado nos CEPs oficiais do município
  { cepStart: 13480000, cepEnd: 13489999, zoneId: "ZONE_METRO_G1", description: "Limeira" }, // baseado nos CEPs oficiais do município
  { cepStart: 13200000, cepEnd: 13219999, zoneId: "ZONE_METRO_G1", description: "Jundiaí" }, // baseado nos CEPs oficiais do município

  // --- ZONE_INTERIOR_G2 Specific Cities ---
  { cepStart: 14800000, cepEnd: 14819999, zoneId: "ZONE_INTERIOR_G2", description: "Araraquara" }, // baseado nos CEPs oficiais do município
  { cepStart: 14000000, cepEnd: 14109999, zoneId: "ZONE_INTERIOR_G2", description: "Ribeirão Preto" }, // baseado nos CEPs oficiais do município
  { cepStart: 15000000, cepEnd: 15099999, zoneId: "ZONE_INTERIOR_G2", description: "São José do Rio Preto" }, // baseado nos CEPs oficiais do município
  { cepStart: 16000000, cepEnd: 16099999, zoneId: "ZONE_INTERIOR_G2", description: "Araçatuba" }, // baseado nos CEPs oficiais do município
  { cepStart: 17000000, cepEnd: 17099999, zoneId: "ZONE_INTERIOR_G2", description: "Bauru" }, // baseado nos CEPs oficiais do município
  { cepStart: 17500000, cepEnd: 17539999, zoneId: "ZONE_INTERIOR_G2", description: "Marília" }, // baseado nos CEPs oficiais do município
  { cepStart: 19000000, cepEnd: 19099999, zoneId: "ZONE_INTERIOR_G2", description: "Presidente Prudente" }, // baseado nos CEPs oficiais do município

  // --- ZONE_REGIONAL_CAPITALS_G3 Specific Cities ---
  { cepStart: 20000000, cepEnd: 23799999, zoneId: "ZONE_REGIONAL_CAPITALS_G3", description: "Rio de Janeiro" }, // baseado nos CEPs oficiais do município
  { cepStart: 24000000, cepEnd: 24399999, zoneId: "ZONE_REGIONAL_CAPITALS_G3", description: "Niterói" }, // baseado nos CEPs oficiais do município
  { cepStart: 30000000, cepEnd: 31999999, zoneId: "ZONE_REGIONAL_CAPITALS_G3", description: "Belo Horizonte" }, // baseado nos CEPs oficiais do município
  { cepStart: 29000000, cepEnd: 29099999, zoneId: "ZONE_REGIONAL_CAPITALS_G3", description: "Vitória" }, // baseado nos CEPs oficiais do município
  { cepStart: 80000000, cepEnd: 82999999, zoneId: "ZONE_REGIONAL_CAPITALS_G3", description: "Curitiba" }, // baseado nos CEPs oficiais do município
  { cepStart: 88000000, cepEnd: 88099999, zoneId: "ZONE_REGIONAL_CAPITALS_G3", description: "Florianópolis" }, // baseado nos CEPs oficiais do município
  { cepStart: 90000000, cepEnd: 91999999, zoneId: "ZONE_REGIONAL_CAPITALS_G3", description: "Porto Alegre" }, // baseado nos CEPs oficiais do município
  { cepStart: 93300000, cepEnd: 93599999, zoneId: "ZONE_REGIONAL_CAPITALS_G3", description: "Novo Hamburgo" }, // baseado nos CEPs oficiais do município
  { cepStart: 70000000, cepEnd: 70999999, zoneId: "ZONE_REGIONAL_CAPITALS_G3", description: "Brasília" }, // baseado nos CEPs oficiais do município
  { cepStart: 74000000, cepEnd: 74899999, zoneId: "ZONE_REGIONAL_CAPITALS_G3", description: "Goiânia" }, // baseado nos CEPs oficiais do município
  { cepStart: 79000000, cepEnd: 79124999, zoneId: "ZONE_REGIONAL_CAPITALS_G3", description: "Campo Grande" }, // baseado nos CEPs oficiais do município

  // --- ZONE_INTERSTATE_G4 Specific Cities ---
  { cepStart: 78000000, cepEnd: 78099999, zoneId: "ZONE_INTERSTATE_G4", description: "Cuiabá" }, // baseado nos CEPs oficiais do município

  // --- ZONE_INTERIOR_G5 Specific Cities ---
  { cepStart: 35500000, cepEnd: 35529999, zoneId: "ZONE_INTERIOR_G5", description: "Divinópolis" }, // baseado nos CEPs oficiais do município
  { cepStart: 38000000, cepEnd: 38099999, zoneId: "ZONE_INTERIOR_G5", description: "Uberaba" }, // baseado nos CEPs oficiais do município
  { cepStart: 36000000, cepEnd: 36099999, zoneId: "ZONE_INTERIOR_G5", description: "Juiz de Fora" }, // baseado nos CEPs oficiais do município
  { cepStart: 84000000, cepEnd: 84089999, zoneId: "ZONE_INTERIOR_G5", description: "Ponta Grossa" }, // baseado nos CEPs oficiais do município
  { cepStart: 87000000, cepEnd: 87099999, zoneId: "ZONE_INTERIOR_G5", description: "Maringá" }, // baseado nos CEPs oficiais do município
  { cepStart: 89000000, cepEnd: 89099999, zoneId: "ZONE_INTERIOR_G5", description: "Blumenau" }, // baseado nos CEPs oficiais do município
  { cepStart: 89800000, cepEnd: 89816999, zoneId: "ZONE_INTERIOR_G5", description: "Chapecó" }, // baseado nos CEPs oficiais do município
  { cepStart: 97000000, cepEnd: 97149999, zoneId: "ZONE_INTERIOR_G5", description: "Santa Maria" }, // baseado nos CEPs oficiais do município
  { cepStart: 86000000, cepEnd: 86099999, zoneId: "ZONE_INTERIOR_G5", description: "Londrina" }, // baseado nos CEPs oficiais do município
  { cepStart: 89200000, cepEnd: 89239999, zoneId: "ZONE_INTERIOR_G5", description: "Joinville" }, // baseado nos CEPs oficiais do município
  { cepStart: 95000000, cepEnd: 95129999, zoneId: "ZONE_INTERIOR_G5", description: "Caxias do Sul" }, // baseado nos CEPs oficiais do município

  // --- ZONE_CAPITALS_G6 Specific Cities ---
  { cepStart: 66000000, cepEnd: 66999999, zoneId: "ZONE_CAPITALS_G6", description: "Belém" }, // baseado nos CEPs oficiais do município
  { cepStart: 77000000, cepEnd: 77249999, zoneId: "ZONE_CAPITALS_G6", description: "Palmas" }, // baseado nos CEPs oficiais do município

  // --- ZONE_LONG_DISTANCE_G7 Specific Cities ---
  { cepStart: 69000000, cepEnd: 69099999, zoneId: "ZONE_LONG_DISTANCE_G7", description: "Manaus" }, // baseado nos CEPs oficiais do município
  { cepStart: 76800000, cepEnd: 76849999, zoneId: "ZONE_LONG_DISTANCE_G7", description: "Porto Velho" }, // baseado nos CEPs oficiais do município
  { cepStart: 68900000, cepEnd: 68914999, zoneId: "ZONE_LONG_DISTANCE_G7", description: "Macapá" }, // baseado nos CEPs oficiais do município

  // --- ZONE_MAX_DISTANCE_G8 Specific Cities ---
  { cepStart: 69900000, cepEnd: 69924999, zoneId: "ZONE_MAX_DISTANCE_G8", description: "Rio Branco" }, // baseado nos CEPs oficiais do município
  { cepStart: 69300000, cepEnd: 69339999, zoneId: "ZONE_MAX_DISTANCE_G8", description: "Boa Vista" }, // baseado nos CEPs oficiais do município

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

  // --- ORIGINAL 7 CATCH-ALL REGIONAL FALLBACKS (COPIED EXACTLY FROM PRE-CALIBRATION SHIPPINGRATES.TS) ---
  { cepStart: 0, cepEnd: 9999999, zoneId: "ZONE_FALLBACK_SP_CAPITAL", description: "Fallback SP Capital" },
  { cepStart: 10000000, cepEnd: 19999999, zoneId: "ZONE_FALLBACK_SP_INTERIOR", description: "Fallback Interior SP" },
  { cepStart: 20000000, cepEnd: 39999999, zoneId: "ZONE_FALLBACK_RJ_ES_MG", description: "Fallback RJ / ES / MG" },

  { cepStart: 66000000, cepEnd: 69999999, zoneId: "ZONE_FALLBACK_NORTE", description: "Fallback Norte" },
  { cepStart: 70000000, cepEnd: 79999999, zoneId: "ZONE_FALLBACK_CENTRO_OESTE", description: "Fallback Centro Oeste" },
  { cepStart: 80000000, cepEnd: 99999999, zoneId: "ZONE_FALLBACK_SUL", description: "Fallback Sul" }
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
