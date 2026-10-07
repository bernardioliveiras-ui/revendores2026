"use client";

import { useEffect, useState } from "react";

type GoogleReview = { author: string; rating: number; text: string; relativeTime: string; url?: string };
type ReviewsPayload = { configured: boolean; rating?: number; userRatingCount?: number; reviews?: GoogleReview[] };

const VIEW_URL = "https://share.google/TfuQVPuf9zfS1dzj7";

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

function useReviewsData() {
  const [data, setData] = useState<ReviewsPayload | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/public/google-reviews", { cache: "no-store", signal: controller.signal })
      .then((response) => response.json())
      .then((payload) => setData(payload))
      .catch(() => setData({ configured: false }));
    return () => controller.abort();
  }, []);
  return data;
}

export function GoogleReviewsDynamic() {
  const data = useReviewsData();
  const liveReviews = data?.reviews?.filter((review) => review.text)?.slice(0, 3) || [];
  const reviews = liveReviews.length ? liveReviews : FALLBACK_REVIEWS;
  const hasLiveScore = Boolean(data?.configured && typeof data.rating === "number");

  return (
    <>
      <div data-cms-text-protected="1" className={`ln-google-score${hasLiveScore ? "" : " neutral"}`} aria-label={hasLiveScore ? `Nota ${data?.rating} de 5 no Google` : "Avaliações da LORD NUTRI no Google"}>
        <span className="ln-google-g" aria-hidden="true">G</span>
        <div>
          <strong>{hasLiveScore ? `${data!.rating!.toFixed(1)} / 5` : "5 estrelas"}</strong>
          <small>{hasLiveScore && data?.userRatingCount ? `${data.userRatingCount} avaliações no Google` : "Confira as avaliações no perfil oficial"}</small>
        </div>
      </div>
      <div className="ln-review-grid" data-cms-text-protected="1">
        {reviews.map((review, index) => (
          <article className="ln-review-card" key={`${review.author}-${index}`}>
            <div className="ln-review-stars" aria-label={`${review.rating} de 5 estrelas`}>{"★".repeat(Math.max(0, Math.min(5, review.rating)))}</div>
            <p>“{review.text}”</p>
            <footer><strong>{review.author}</strong><span>{review.relativeTime}</span></footer>
          </article>
        ))}
      </div>
    </>
  );
}

export function GoogleReviews() {
  return (
    <section className="ln-reviews lnr-shell" id="avaliacoes">
      <div className="lnr-review-heading">
        <span className="lnr-eyebrow" data-cms-explicit-key="text:avaliacoes:eyebrow">AVALIAÇÕES NO GOOGLE</span>
        <h2><span data-cms-explicit-key="text:avaliacoes:title">A confiança também aparece na experiência de quem já comprou.</span></h2>
        <p><span data-cms-explicit-key="text:avaliacoes:intro">Confira avaliações reais publicadas por clientes no Google e veja como o MIX10 PRO vem fazendo parte da rotina de diferentes consumidores.</span></p>
      </div>
      <GoogleReviewsDynamic />
      <p className="lnr-review-disclaimer"><span data-cms-explicit-key="text:avaliacoes:disclaimer">Os relatos representam experiências individuais de clientes. Os resultados podem variar de pessoa para pessoa.</span></p>
      <div className="ln-review-actions">
        <a className="lnr-button" href={VIEW_URL} target="_blank" rel="noopener noreferrer"><span data-cms-explicit-key="text:avaliacoes:cta-google">VER AVALIAÇÕES NO GOOGLE</span></a>
      </div>
    </section>
  );
}
