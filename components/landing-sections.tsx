import { landingText, type LandingTexts } from "@/lib/landing-texts";
import { parseAnvisaNotification } from "@/lib/anvisa-notification";
/* eslint-disable @next/next/no-img-element */
// Conteúdo publicado em 09/10/2026, incorporado ao código sem dependência do Studio.
import { BrandLogo } from '@/components/brand-logo';
import { CheckoutForm } from '@/components/checkout-form';
import { ProfitSimulator } from '@/components/profit-simulator';
export function LandingSections({texts={}}:{texts?:LandingTexts}={}) {
  const anvisa = parseAnvisaNotification(landingText(texts, "mix10pro.007"));
  return <>
<section id={"lord-nutri"} className={"lnr-section lnr-opportunity"}>
        <div className={"lnr-shell"}>
          <div className={"lnr-opportunity-intro"}>
            <div className={"lnr-brand-story-copy"}>
              <span className={"lnr-eyebrow"}>{landingText(texts, "lord-nutri.001")}</span>
              <h2 className={"lnr-brand-story-lead"}>{landingText(texts, "lord-nutri.002")}<span className={"lnr-lord-name"}>{"LORD NUTRI"}</span>{"."}</h2>
              <p>{landingText(texts, "lord-nutri.003")}</p>
              <p>{landingText(texts, "lord-nutri.004")}</p>
            </div>
            <figure className={"lnr-people-visual"} aria-label={landingText(texts, "lord-nutri.005")}>
              <img src={"/brand/conversa-pessoas-1.8.webp"}  sizes={"(max-width: 700px) 100vw, 58vw"} alt={landingText(texts, "lord-nutri.006")} width={"1536"} height={"1024"} loading={"lazy"} decoding={"async"} />
            </figure>
          </div>
          <div className={"lnr-trust-grid"}>
            <article className={"lnr-trust-card"}>
              <svg xmlns={"http://www.w3.org/2000/svg"} width={"28"} height={"28"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.5"} strokeLinecap={"round"} strokeLinejoin={"round"} className={"lucide lucide-building-complex lucide-building-2"} aria-hidden={"true"}>
                <path d={"M10 12h4"}>
                  
                </path>
                <path d={"M10 8h4"}>
                  
                </path>
                <path d={"M14 21v-3a2 2 0 0 0-4 0v3"}>
                  
                </path>
                <path d={"M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"}>
                  
                </path>
                <path d={"M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"}>
                  
                </path>
              </svg>
              <h3>{landingText(texts, "lord-nutri.007")}</h3>
              <p>{landingText(texts, "lord-nutri.008")}</p>
            </article>
            <article className={"lnr-trust-card"}>
              <svg xmlns={"http://www.w3.org/2000/svg"} width={"28"} height={"28"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.5"} strokeLinecap={"round"} strokeLinejoin={"round"} className={"lucide lucide-wallet-cards"} aria-hidden={"true"}>
                <path d={"M3 11h3.75a2 2 0 0 1 1.6.8l.45.6a4 4 0 0 0 6.4 0l.45-.6a2 2 0 0 1 1.6-.8H21"}>
                  
                </path>
                <path d={"M3 7h18"}>
                  
                </path>
                <rect x={"3"} y={"3"} width={"18"} height={"18"} rx={"2"}>
                  
                </rect>
              </svg>
              <h3>{landingText(texts, "lord-nutri.009")}</h3>
              <p>{landingText(texts, "lord-nutri.010")}</p>
            </article>
            <article className={"lnr-trust-card"}>
              <svg xmlns={"http://www.w3.org/2000/svg"} width={"28"} height={"28"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.5"} strokeLinecap={"round"} strokeLinejoin={"round"} className={"lucide lucide-message-circle"} aria-hidden={"true"}>
                <path d={"M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"}>
                  
                </path>
              </svg>
              <h3>{landingText(texts, "lord-nutri.011")}</h3>
              <p>{landingText(texts, "lord-nutri.012")}</p>
            </article>
          </div>
          <div className={"lnr-inline-action"}>
            <a className={"lnr-button"} href={"#mix10pro"}><span>{landingText(texts, "lord-nutri.013")}</span></a>
            <a className={"lnr-button"} href={"#mix10pro"}><span>{landingText(texts, "lord-nutri.014")}</span></a>
          </div>
        </div>
      </section>
<section id={"mix10pro"} className={"lnr-section lnr-product"}>
        <div className={"lnr-shell"}>
          <div className={"lnr-product-grid"}>
            <div className={"lnr-product-copy"}>
              <h2>{landingText(texts, "mix10pro.001")}<span className={"lnr-mix-name"}><span>{"MIX10"}</span>{" "}<span>{"PRO"}</span>{"."}</span></h2>
              <p>{landingText(texts, "mix10pro.002")}<span className={"lnr-mix-name"}><span>{"MIX10"}</span>{" "}<span>{"PRO"}</span></span>{landingText(texts, "mix10pro.003")}</p>
              <div className={"lnr-product-overview"}>
                <article className={"lnr-product-overview-card"}>
                  <span>{"POSICIONAMENTO DO PRODUTO"}</span>
                  <p>
                    {"O MIX10 PRO reúne 10 ativos em uma única fórmula, criando uma proposta diferenciada para pessoas que buscam complementar a rotina de cuidados com o corpo, bem-estar e qualidade de vida."}
                  </p>
                </article>
                <article className={"lnr-product-overview-card"}>
                  <span>{"APRESENTAÇÃO MAIS CLARA"}</span>
                  <p>
                    {"Nesta versão, a leitura da seção foi reorganizada para destacar melhor a proposta do produto, facilitar a compreensão e deixar o conteúdo mais limpo e objetivo."}
                  </p>
                </article>
              </div>
            </div>
            <div className={"lnr-product-visual"}>
              <img src={"/brand/mix10-box-transparent-v3-web.webp"} alt={landingText(texts, "mix10pro.008")} loading={"lazy"} decoding={"async"} width={"800"} height={"1067"} />
              <p className={"lnr-anvisa"} aria-label={anvisa.fullText}>
                {anvisa.heading ? <span className={"lnr-anvisa-line"}>{anvisa.heading}</span> : null}
                {anvisa.subtitle ? <span className={"lnr-anvisa-line"}>{anvisa.subtitle}</span> : null}
                {anvisa.number ? <strong className={"lnr-anvisa-line"}>{anvisa.number}</strong> : null}
              </p>
              <span>{landingText(texts, "mix10pro.009")}</span>
            </div>
          </div>
          <div id={"beneficios"} className={"lnr-benefits"}>
            <div className={"lnr-section-head"}>
              <span className={"lnr-eyebrow"}>{landingText(texts, "beneficios.001")}</span>
              <h2>{landingText(texts, "beneficios.002")}</h2>
              <p>{landingText(texts, "beneficios.003")}</p>
            </div>
            <div className={"lnr-benefit-grid"}>
              <article className={"lnr-benefit-card"}>
                <svg xmlns={"http://www.w3.org/2000/svg"} width={"28"} height={"28"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.5"} strokeLinecap={"round"} strokeLinejoin={"round"} className={"lucide lucide-activity"} aria-hidden={"true"}>
                  <path d={"M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"}>
                    
                  </path>
                </svg>
                <h3>{landingText(texts, "beneficios.004")}</h3>
                <p>{landingText(texts, "beneficios.005")}</p>
              </article>
              <article className={"lnr-benefit-card"}>
                <svg xmlns={"http://www.w3.org/2000/svg"} width={"28"} height={"28"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.5"} strokeLinecap={"round"} strokeLinejoin={"round"} className={"lucide lucide-heart"} aria-hidden={"true"}>
                  <path d={"M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"}>
                    
                  </path>
                </svg>
                <h3>{landingText(texts, "beneficios.006")}</h3>
                <p>{landingText(texts, "beneficios.007")}</p>
              </article>
              <article className={"lnr-benefit-card"}>
                <svg xmlns={"http://www.w3.org/2000/svg"} width={"28"} height={"28"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.5"} strokeLinecap={"round"} strokeLinejoin={"round"} className={"lucide lucide-activity"} aria-hidden={"true"}>
                  <path d={"M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"}>
                    
                  </path>
                </svg>
                <h3>{landingText(texts, "beneficios.008")}</h3>
                <p>{landingText(texts, "beneficios.009")}</p>
              </article>
              <article className={"lnr-benefit-card"}>
                <svg xmlns={"http://www.w3.org/2000/svg"} width={"28"} height={"28"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.5"} strokeLinecap={"round"} strokeLinejoin={"round"} className={"lucide lucide-sparkles lucide-stars"} aria-hidden={"true"}>
                  <path d={"M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"}>
                    
                  </path>
                  <path d={"M20 2v4"}>
                    
                  </path>
                  <path d={"M22 4h-4"}>
                    
                  </path>
                  <circle cx={"4"} cy={"20"} r={"2"}>
                    
                  </circle>
                </svg>
                <h3>{landingText(texts, "beneficios.010")}</h3>
                <p>{landingText(texts, "beneficios.011")}</p>
              </article>
              <article className={"lnr-benefit-card"}>
                <svg xmlns={"http://www.w3.org/2000/svg"} width={"28"} height={"28"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.5"} strokeLinecap={"round"} strokeLinejoin={"round"} className={"lucide lucide-shield-check"} aria-hidden={"true"}>
                  <path d={"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"}>
                    
                  </path>
                  <path d={"m9 12 2 2 4-4"}>
                    
                  </path>
                </svg>
                <h3>{landingText(texts, "beneficios.012")}</h3>
                <p>{landingText(texts, "beneficios.013")}</p>
              </article>
            </div>
            <p className={"lnr-note"}>{landingText(texts, "beneficios.014")}</p>
          </div>
          <div className={"lnr-product-detail-grid"}>
            <div>
              <span className={"lnr-eyebrow"}>{landingText(texts, "mix10pro.010")}</span>
              <h3>{landingText(texts, "mix10pro.011")}<span className={"lnr-mix-name"}><span>{"MIX10"}</span>{" "}<span>{"PRO"}</span></span>{landingText(texts, "mix10pro.012")}</h3>
              <p>{landingText(texts, "mix10pro.013")}<span className={"lnr-mix-name"}><span>{"MIX10"}</span>{" "}<span>{"PRO"}</span></span>{landingText(texts, "mix10pro.014")}</p>
              <p className={"lnr-note"}><span className={"lnr-mix-name"}><span>{"MIX10"}</span>{" "}<span>{"PRO"}</span></span>{landingText(texts, "mix10pro.015")}</p>
            </div>
            <div className={"lnr-product-pillars"}>
              <details className={"lnr-disclosure"}>
                <summary><h3>{landingText(texts, "mix10pro.016")}</h3><span className={"lnr-plus"} aria-hidden={"true"}></span></summary>
                <div className={"lnr-active-composition"}>
                  <p>{landingText(texts, "mix10pro.017")}</p>
                  <dl>
                    <div>
                      <dt>{landingText(texts, "mix10pro.018")}</dt>
                      <dd>{landingText(texts, "mix10pro.019")}</dd>
                    </div>
                    <div>
                      <dt>{landingText(texts, "mix10pro.020")}</dt>
                      <dd>{landingText(texts, "mix10pro.021")}</dd>
                    </div>
                    <div>
                      <dt>{landingText(texts, "mix10pro.022")}</dt>
                      <dd>{landingText(texts, "mix10pro.023")}</dd>
                    </div>
                    <div>
                      <dt>{landingText(texts, "mix10pro.024")}</dt>
                      <dd>{landingText(texts, "mix10pro.025")}</dd>
                    </div>
                    <div>
                      <dt>{landingText(texts, "mix10pro.026")}</dt>
                      <dd>{landingText(texts, "mix10pro.027")}</dd>
                    </div>
                    <div>
                      <dt>{landingText(texts, "mix10pro.028")}</dt>
                      <dd>{landingText(texts, "mix10pro.029")}</dd>
                    </div>
                    <div>
                      <dt>{landingText(texts, "mix10pro.030")}</dt>
                      <dd>{landingText(texts, "mix10pro.031")}</dd>
                    </div>
                    <div>
                      <dt>{landingText(texts, "mix10pro.032")}</dt>
                      <dd>{landingText(texts, "mix10pro.033")}</dd>
                    </div>
                    <div>
                      <dt>{landingText(texts, "mix10pro.034")}</dt>
                      <dd>{landingText(texts, "mix10pro.035")}</dd>
                    </div>
                    <div>
                      <dt>{landingText(texts, "mix10pro.036")}</dt>
                      <dd>{landingText(texts, "mix10pro.037")}</dd>
                    </div>
                  </dl>
                </div>
              </details>
              <details className={"lnr-disclosure"}>
                <summary><h3>{landingText(texts, "mix10pro.038")}</h3><span className={"lnr-plus"} aria-hidden={"true"}></span></summary>
                <div className={"lnr-product-guidance"}>
                  <p><strong>{landingText(texts, "mix10pro.039")}</strong><span>{landingText(texts, "mix10pro.040")}</span></p>
                  <p><strong>{landingText(texts, "mix10pro.041")}</strong><span>{landingText(texts, "mix10pro.042")}</span></p>
                  <p><strong>{landingText(texts, "mix10pro.043")}</strong><span>{landingText(texts, "mix10pro.044")}</span></p>
                </div>
              </details>
            </div>
          </div>
          <div className={"lnr-testimonial-section"}>
            <div className={"lnr-testimonial-copy"}>
              <span className={"lnr-eyebrow"}>{"UMA EXPERIÊNCIA REAL"}</span>
              <h2>{"NÃO FIQUE SÓ NA DESCRIÇÃO. CONHEÇA A EXPERIÊNCIA DE QUEM JÁ EXPERIMENTOU."}</h2>
              <p>
                {"Antes de começar a revender, você também quer conhecer a experiência de quem já conhece o Mix10Pro, não é?"}
              </p>
            </div>
            <div className={"lnr-testimonial-media"}>
              <div className={"lnr-testimonial-video-wrap"}>
                <video controls playsInline preload={"metadata"}>
                  <source src={"https://mix10pro.com.br/dp-mariasocorro.mp4"} type={"video/mp4"} />
                  {"Seu navegador não suporta vídeo HTML5."}
                </video>
              </div>
              <p className={"lnr-testimonial-caption"}>{"Depoimento em vídeo — Maria Socorro"}</p>
            </div>
          </div>
          <div className={"lnr-google-business-section"}>
            <div className={"lnr-google-business-mark"} aria-hidden={"true"}>{"G"}</div>
            <div className={"lnr-google-business-copy"}>
              <span>{"GOOGLE MEU NEGÓCIO"}</span>
              <h3>{"Mais autenticidade para quem está conhecendo a LORD NUTRI."}</h3>
              <p>
                {"Além do depoimento em vídeo, o visitante pode acessar o perfil no Google, conferir informações públicas da empresa e ver avaliações antes de começar sua revenda."}
              </p>
            </div>
            <a className={"lnr-google-business-button"} href={"https://share.google/Dj32yNldD2417zSXQ"} target={"_blank"} rel={"noopener noreferrer"}>
              {"VER PERFIL NO GOOGLE"}
            </a>
          </div>
          <div className={"lnr-inline-action"}>
            <a className={"lnr-button"} href={"#modelo"}><span>{landingText(texts, "mix10pro.045")}</span></a>
          </div>
        </div>
      </section>
<section id={"modelo"} className={"lnr-section lnr-model"}>
        <div className={"lnr-shell"}>
          <div className={"lnr-section-head"}>
            <span className={"lnr-eyebrow"}>{landingText(texts, "modelo.001")}</span>
            <h2>{landingText(texts, "modelo.002")}<span className={"lnr-lord-name"}>{"LORD NUTRI"}</span>{landingText(texts, "modelo.003")}</h2>
            <p>{landingText(texts, "modelo.004")}</p>
          </div>
          <div className={"lnr-model-facts"} aria-label={landingText(texts, "modelo.005")}>
            <div>
              <strong>{landingText(texts, "modelo.006")}</strong>
              <span>{landingText(texts, "modelo.007")}</span>
            </div>
            <div>
              <strong>{landingText(texts, "modelo.008")}</strong>
              <span>{landingText(texts, "modelo.009")}</span>
            </div>
            <div>
              <strong>{landingText(texts, "modelo.010")}</strong>
              <span>{landingText(texts, "modelo.011")}</span>
            </div>
          </div>
          <div className={"lnr-steps"}>
            <article className={"lnr-step lnr-disclosure"}>
              <div className={"lnr-step-heading"}>
                <span className={"lnr-number"}>{"01"}</span>
                <h3>{landingText(texts, "modelo.012")}</h3>
              </div>
              <p>{landingText(texts, "modelo.013")}</p>
            </article>
            <article className={"lnr-step lnr-disclosure"}>
              <div className={"lnr-step-heading"}>
                <span className={"lnr-number"}>{"02"}</span>
                <h3>{landingText(texts, "modelo.014")}<span className={"lnr-lord-name"}>{"LORD NUTRI"}</span></h3>
              </div>
              <p>{landingText(texts, "modelo.015")}<span className={"lnr-lord-name"}>{"LORD NUTRI"}</span>{landingText(texts, "modelo.016")}</p>
            </article>
            <article className={"lnr-step lnr-disclosure"}>
              <div className={"lnr-step-heading"}>
                <span className={"lnr-number"}>{"03"}</span>
                <h3>{landingText(texts, "modelo.017")}</h3>
              </div>
              <p>{landingText(texts, "modelo.018")}</p>
            </article>
          </div>
          <div className={"lnr-care-band"}>
            <img src={"/brand/caminhada-pessoas-1.8.webp"}  sizes={"(max-width: 700px) calc(100vw - 32px), (max-width: 1199px) calc((100vw - 48px) / 2), 600px"} alt={landingText(texts, "modelo.019")} width={"1536"} height={"1024"} loading={"lazy"} decoding={"async"} />
            <div>
              <span className={"lnr-eyebrow"}>{landingText(texts, "modelo.020")}</span>
              <h3>{landingText(texts, "modelo.021")}<br />{landingText(texts, "modelo.022")}</h3>
              <p>{landingText(texts, "modelo.023")}</p>
            </div>
          </div>
          <div className={"lnr-inline-action"}>
            <a className={"lnr-button"} href={"#simulador"}><span>{landingText(texts, "modelo.024")}</span></a>
            <p className={"lnr-note"}>{landingText(texts, "modelo.025")}</p>
          </div>
        </div>
      </section>
<section id={"simulador"} className={"lnr-section lnr-simulator"}>
        <div className={"lnr-shell"}>
          <div className={"lnr-section-head"}>
            <span className={"lnr-eyebrow"}>{landingText(texts, "simulador.001")}</span>
            <h2>{landingText(texts, "simulador.002")}</h2>
            <p>{landingText(texts, "simulador.003")}</p>
          </div>
          <div className={"lnr-scenarios"}>
            <article className={"lnr-scenario"}>
              <span className={"lnr-scenario-rhythm"}><b>{"1"}</b>{" "}<span>{landingText(texts, "simulador.004")}</span></span>
              <p>{landingText(texts, "simulador.005")}</p>
              <dl>
                <div>
                  <dt>{landingText(texts, "simulador.006")}</dt>
                  <dd>{"R$ 910,00"}</dd>
                </div>
                <div>
                  <dt>{landingText(texts, "simulador.007")}</dt>
                  <dd>{"R$ 1.040,00"}</dd>
                </div>
              </dl>
            </article>
            <article className={"lnr-scenario"}>
              <span className={"lnr-scenario-rhythm"}><b>{"2"}</b>{" "}<span>{landingText(texts, "simulador.008")}</span></span>
              <p>{landingText(texts, "simulador.009")}</p>
              <dl>
                <div>
                  <dt>{landingText(texts, "simulador.010")}</dt>
                  <dd>{"R$ 1.820,00"}</dd>
                </div>
                <div>
                  <dt>{landingText(texts, "simulador.011")}</dt>
                  <dd>{"R$ 2.080,00"}</dd>
                </div>
              </dl>
            </article>
            <article className={"lnr-scenario"}>
              <span className={"lnr-scenario-rhythm"}><b>{"3"}</b>{" "}<span>{landingText(texts, "simulador.012")}</span></span>
              <p>{landingText(texts, "simulador.013")}</p>
              <dl>
                <div>
                  <dt>{landingText(texts, "simulador.014")}</dt>
                  <dd>{"R$ 2.730,00"}</dd>
                </div>
                <div>
                  <dt>{landingText(texts, "simulador.015")}</dt>
                  <dd>{"R$ 3.120,00"}</dd>
                </div>
              </dl>
            </article>
          </div>
          <p className={"lnr-note"}>{landingText(texts, "simulador.016")}</p>
          <div id={"simulador-calculo"}>
            <ProfitSimulator texts={texts} />
          </div>
          <div className={"lnr-inline-action"}>
            <a href={"#kits"} className={"lnr-button"}><span>{landingText(texts, "simulador.017")}</span></a>
          </div>
        </div>
      </section>
<section id={"kits"} className={"lnr-section lnr-kits"}>
        <div className={"lnr-shell"}>
          <div className={"lnr-section-head"}>
            <span className={"lnr-eyebrow"}>{landingText(texts, "kits.001")}</span>
            <h2>{landingText(texts, "kits.002")}</h2>
          </div>
          <div className={"lnr-kit-grid"}>
            <article className={"lnr-kit"}>
              <span className={"lnr-kit-badge"}>{landingText(texts, "kits.003")}</span>
              <div className={"lnr-kit-title"}>
                <h3>{"KIT20"}</h3>
                <span>{landingText(texts, "kits.004")}</span>
              </div>
              <span className={"lnr-price-label"}>{landingText(texts, "kits.005")}</span>
              <strong className={"lnr-price"}>{"R$ 1.498,00"}</strong>
              <dl>
                <div>
                  <dt>{landingText(texts, "kits.006")}</dt>
                  <dd>{"R$ 74,90"}</dd>
                </div>
                <div>
                  <dt>{landingText(texts, "kits.007")}</dt>
                  <dd>{"R$ 109,90"}</dd>
                </div>
                <div>
                  <dt>{landingText(texts, "kits.008")}</dt>
                  <dd>{"R$ 35,00"}</dd>
                </div>
                <div className={"lnr-kit-total"}>
                  <dt>{landingText(texts, "kits.009")}</dt>
                  <dd>{"R$ 700,00"}</dd>
                </div>
              </dl>
              <a href={"/?kit=kit20#checkout"} className={"lnr-button lnr-button-outline"}>{landingText(texts, "kits.010")}</a>
            </article>
            <article className={"lnr-kit lnr-kit-featured"}>
              <span className={"lnr-kit-badge"}>{landingText(texts, "kits.011")}</span>
              <div className={"lnr-kit-title"}>
                <h3>{"KIT50"}</h3>
                <span>{landingText(texts, "kits.012")}</span>
              </div>
              <span className={"lnr-price-label"}>{landingText(texts, "kits.013")}</span>
              <strong className={"lnr-price"}>{"R$ 3.495,00"}</strong>
              <dl>
                <div>
                  <dt>{landingText(texts, "kits.014")}</dt>
                  <dd>{"R$ 69,90"}</dd>
                </div>
                <div>
                  <dt>{landingText(texts, "kits.015")}</dt>
                  <dd>{"R$ 109,90"}</dd>
                </div>
                <div>
                  <dt>{landingText(texts, "kits.016")}</dt>
                  <dd>{"R$ 40,00"}</dd>
                </div>
                <div className={"lnr-kit-total"}>
                  <dt>{landingText(texts, "kits.017")}</dt>
                  <dd>{"R$ 2.000,00"}</dd>
                </div>
              </dl>
              <a href={"/?kit=kit50#checkout"} className={"lnr-button"}>{landingText(texts, "kits.018")}</a>
            </article>
          </div>
          <p className={"lnr-kit-comparison"}>{landingText(texts, "kits.019")}</p>
          <p className={"lnr-note"}>{landingText(texts, "kits.020")}</p>
        </div>
      </section>
<section id={"duvidas"} className={"lnr-section lnr-faq"}>
        <div className={"lnr-shell lnr-faq-layout"}>
          <div>
            <span className={"lnr-eyebrow"}>{landingText(texts, "duvidas.001")}</span>
            <h2>{landingText(texts, "duvidas.002")}</h2>
          </div>
          <div className={"lnr-faq-list"}>
            <details className={"lnr-disclosure"}>
              <summary><h3>{landingText(texts, "duvidas.003")}</h3><span className={"lnr-plus"} aria-hidden={"true"}></span></summary>
              <p>{landingText(texts, "duvidas.004")}</p>
            </details>
            <details className={"lnr-disclosure"}>
              <summary><h3>{landingText(texts, "duvidas.005")}</h3><span className={"lnr-plus"} aria-hidden={"true"}></span></summary>
              <p>{landingText(texts, "duvidas.006")}<span className={"lnr-lord-name"}>{"LORD NUTRI"}</span>{landingText(texts, "duvidas.007")}</p>
            </details>
            <details className={"lnr-disclosure"}>
              <summary><h3>{landingText(texts, "duvidas.008")}</h3><span className={"lnr-plus"} aria-hidden={"true"}></span></summary>
              <p>{landingText(texts, "duvidas.009")}</p>
            </details>
            <details className={"lnr-disclosure"}>
              <summary><h3>{landingText(texts, "duvidas.010")}</h3><span className={"lnr-plus"} aria-hidden={"true"}></span></summary>
              <p>{landingText(texts, "duvidas.011")}</p>
            </details>
            <details className={"lnr-disclosure"}>
              <summary><h3>{landingText(texts, "duvidas.012")}</h3><span className={"lnr-plus"} aria-hidden={"true"}></span></summary>
              <p>{landingText(texts, "duvidas.013")}</p>
            </details>
          </div>
        </div>
      </section>
<section id={"checkout"} className={"lnr-section lnr-checkout"}>
        <div className={"lnr-shell lnr-checkout-layout"}>
          <div>
            <span className={"lnr-eyebrow"}>{landingText(texts, "checkout.001")}</span>
            <h2>{landingText(texts, "checkout.002")}</h2>
            <p>{landingText(texts, "checkout.003")}</p>
          </div>
          <CheckoutForm texts={texts} />
        </div>
      </section>
<footer className={"lnr-footer"}>
        <div className={"lnr-shell"}>
          <div>
            <BrandLogo compact />
            <p><span className={"lnr-mix-name"}><span>{"MIX10"}</span>{" "}<span>{"PRO"}</span></span></p>
            <p>{landingText(texts, "rodape.001")}</p>
          </div>
          <nav aria-label={landingText(texts, "rodape.002")}>
            <a href={"/termos-de-uso"}>{landingText(texts, "rodape.003")}</a>
            <a href={"/politica-de-privacidade"}>{landingText(texts, "rodape.004")}</a>
            <a href={"/cookies"}>{landingText(texts, "rodape.005")}</a>
            <a href={"/reembolso-e-devolucao"}>{landingText(texts, "rodape.006")}</a>
            <a href={"/entrar"}>{landingText(texts, "rodape.007")}</a>
            <a className={"lnr-google-check"} href={"https://transparencyreport.google.com/safe-browsing/search?url=https%3A%2F%2Frevendedores.mix10pro.com.br%2F"} target={"_blank"} rel={"noopener noreferrer"}>{landingText(texts, "rodape.008")}</a>
          </nav>
        </div>
      </footer>
  </>;
}
