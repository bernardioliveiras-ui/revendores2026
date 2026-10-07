"use client";

import { useEffect, useState } from "react";

type GoogleReview = { author: string; rating: number; text: string; relativeTime: string; url?: string };
type ReviewsPayload = { configured: boolean; rating?: number; userRatingCount?: number; reviews?: GoogleReview[] };

const VIEW_URL = "https://share.google/TfuQVPuf9zfS1dzj7";
const PRODUCT_URL = "https://mix10pro.com.br/lp-v2";

const FALLBACK_REVIEWS: GoogleReview[] = [
  {
    author: "Sueli",
    rating: 5,
    relativeTime: "Avaliação recente no Google",
    text: "Gostei do suplemento, estou tendo resultados com o uso, mim ajudou nas dores, no sono na energia e cumpre realmente o que promete",
  },
  {
    author: "Henrique Jose Freitas",
    rating: 5,
    relativeTime: "Avaliação recente no Google",
    text: "Produto fantástico, vi resultado no primeiro dia. Super indico",
  },
];

export function GoogleReviews() {
  const [data, setData] = useState<ReviewsPayload | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/public/google-reviews", { cache: "no-store", signal: controller.signal })
      .then((response) => response.json())
      .then((payload) => setData(payload))
      .catch(() => setData({ configured: false }));
    return () => controller.abort();
  }, []);

  const liveReviews = data?.reviews?.filter((review) => review.text)?.slice(0, 3) || [];
  const reviews = liveReviews.length ? liveReviews : FALLBACK_REVIEWS;
  const hasLiveScore = Boolean(data?.configured && typeof data.rating === "number");

  return (
    <section className="ln-reviews lnr-shell" id="avaliacoes">
      <div className="lnr-review-heading">
        <span className="lnr-eyebrow">AVALIAÇÕES NO GOOGLE</span>
        <h2>Confiança também se constrói com quem já comprou.</h2>
        <p>Veja experiências publicadas por clientes e, se ainda quiser conhecer o produto antes de começar a revender, visite o site institucional e compre uma unidade.</p>
      </div>

      <div className={`ln-google-score${hasLiveScore ? "" : " neutral"}`} aria-label={hasLiveScore ? `Nota ${data?.rating} de 5 no Google` : "Avaliações da LORD NUTRI no Google"}>
        <span className="ln-google-g" aria-hidden="true">G</span>
        <div>
          <strong>{hasLiveScore ? `${data!.rating!.toFixed(1)} / 5` : "5 estrelas"}</strong>
          <small>{hasLiveScore && data?.userRatingCount ? `${data.userRatingCount} avaliações no Google` : "Confira as avaliações no perfil oficial"}</small>
        </div>
      </div>

      <div className="ln-review-grid">
        {reviews.map((review, index) => (
          <article className="ln-review-card" key={`${review.author}-${index}`}>
            <div className="ln-review-stars" aria-label={`${review.rating} de 5 estrelas`}>{"★".repeat(Math.max(0, Math.min(5, review.rating)))}</div>
            <p>“{review.text}”</p>
            <footer><strong>{review.author}</strong><span>{review.relativeTime}</span></footer>
          </article>
        ))}
      </div>

      <p className="lnr-review-disclaimer">Relatos representam experiências individuais de clientes. Resultados podem variar e não substituem orientação profissional.</p>

      <div className="ln-review-actions">
        <a className="lnr-button" href={VIEW_URL} target="_blank" rel="noopener noreferrer"><span>VER AVALIAÇÕES NO GOOGLE</span></a>
        <a className="lnr-button lnr-button-outline lnr-institutional-button" href={PRODUCT_URL} target="_blank" rel="noopener noreferrer"><span>QUERO CONHECER 1 UNIDADE PRIMEIRO</span></a>
      </div>
      <p className="lnr-product-trial-copy">Ainda inseguro sobre entrar no programa? Conheça o MIX10 PRO no site institucional antes de escolher seu kit de revenda.</p>
    </section>
  );
}
