import { getOptionalEnv } from "@/lib/env";

const PLACE_ID = "ChIJCZtZ98MDz5QRWv8YdIPkPic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = getOptionalEnv("GOOGLE_PLACES_API_KEY") || "";
  if (!apiKey) return Response.json({ configured: false, placeId: PLACE_ID }, { headers: { "cache-control": "public, max-age=3600" } });
  try {
    const response = await fetch(`https://places.googleapis.com/v1/places/${PLACE_ID}?languageCode=pt-BR`, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "rating,userRatingCount,reviews.rating,reviews.text,reviews.relativePublishTimeDescription,reviews.authorAttribution.displayName,reviews.authorAttribution.uri",
      },
      next: { revalidate: 3600 },
    });
    if (!response.ok) throw new Error(`Google Places ${response.status}`);
    const body = await response.json();
    return Response.json({
      configured: true,
      rating: typeof body.rating === "number" ? body.rating : undefined,
      userRatingCount: typeof body.userRatingCount === "number" ? body.userRatingCount : undefined,
      reviews: Array.isArray(body.reviews) ? body.reviews.map((review: {authorAttribution?: {displayName?: string; uri?: string}; rating?: number; text?: {text?: string}; relativePublishTimeDescription?: string}) => ({
        author: review?.authorAttribution?.displayName || "Cliente Google",
        url: review?.authorAttribution?.uri || "",
        rating: Number(review?.rating || 0),
        text: typeof review?.text?.text === "string" ? review.text.text.slice(0, 600) : "",
        relativeTime: review?.relativePublishTimeDescription || "",
      })) : [],
    }, { headers: { "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
  } catch (error) {
    console.error("google_reviews_failed", error);
    return Response.json({ configured: false, placeId: PLACE_ID }, { headers: { "cache-control": "public, max-age=600" } });
  }
}
