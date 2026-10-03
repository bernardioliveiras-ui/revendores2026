"use client";

import { useEffect, useState } from "react";

type GoogleReview = { author: string; rating: number; text: string; relativeTime: string; url?: string };
type ReviewsPayload = { configured: boolean; rating?: number; userRatingCount?: number; reviews?: GoogleReview[] };

const VIEW_URL = "https://www.google.com/maps/search/?api=1&query=LORD%20NUTRI&query_place_id=ChIJCZtZ98MDz5QRWv8YdIPkPic";
const WRITE_URL = "https://g.page/r/CVr_GHSD5D4nECE/review";

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

  const reviews = data?.reviews?.filter((review) => review.text)?.slice(0, 3) || [];

  return (
    <section className="ln-reviews section-shell" id="avaliacoes">
      <div className="ln-section-head left">
        <span className="section-kicker">Reputação e confiança</span>
        <h2>A LORD NUTRI também está no Google.</h2>
        <p>Consulte avaliações públicas no perfil da empresa e, se já teve uma experiência conosco, compartilhe sua opinião diretamente no Google.</p>
      </div>

      {data?.configured && typeof data.rating === "number" ? (
        <div className="ln-google-score" aria-label={`Nota ${data.rating} de 5 no Google`}>
          <span className="ln-google-g">G</span>
          <div><strong>{data.rating.toFixed(1)} / 5</strong><small>{data.userRatingCount || 0} avaliações no Google</small></div>
        </div>
      ) : (
        <div className="ln-google-score neutral">
          <span className="ln-google-g">G</span>
          <div><strong>Avaliações no Google</strong><small>Veja a fonte original no perfil da LORDNUTRI.</small></div>
        </div>
      )}

      {reviews.length ? (
        <div className="ln-review-grid">
          {reviews.map((review, index) => (
            <article className="ln-review-card" key={`${review.author}-${index}`}>
              <div className="ln-review-stars" aria-label={`${review.rating} de 5 estrelas`}>{"★".repeat(Math.max(0, Math.min(5, review.rating)))}</div>
              <p>“{review.text}”</p>
              <footer><strong>{review.author}</strong><span>{review.relativeTime}</span></footer>
            </article>
          ))}
        </div>
      ) : (
        <div className="ln-review-placeholder-grid" aria-label="Atalhos para o perfil da LORD NUTRI no Google">
          <article><b>01</b><strong>Confira a reputação</strong><span>Leia comentários publicados diretamente no Google.</span></article>
          <article><b>02</b><strong>Valide antes de começar</strong><span>Use a fonte original para conhecer experiências de clientes.</span></article>
          <article><b>03</b><strong>Compartilhe sua experiência</strong><span>Seu feedback ajuda outras pessoas a conhecerem a LORDNUTRI.</span></article>
        </div>
      )}

      <div className="ln-review-actions">
        <a className="primary-button" href={VIEW_URL} target="_blank" rel="noopener noreferrer">VER AVALIAÇÕES NO GOOGLE</a>
        <a className="secondary-button" href={WRITE_URL} target="_blank" rel="noopener noreferrer">AVALIAR A LORD NUTRI</a>
      </div>
    </section>
  );
}
