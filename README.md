# Plate

Diary for meals out. Letterboxd for local restaurants.

v1 loop: find a place → log a visit → rate + short note → lists.

Portland is the first metro. Data stays in your browser.

## Run

```bash
npm install
npm run dev
```

```bash
npm run typecheck
npm run build
```

## Google Places (optional)

Find-a-place uses [Places API (New) Autocomplete](https://developers.google.com/maps/documentation/places/web-service/place-autocomplete) when a **server-side** key is set. The browser never sees the key. Requests go through `/api/places/*`.

Without a key, Portland seed places and manual add still work.

### Enable

1. In Google Cloud Console, enable **Places API (New)** (Place Photos is included for the optional identity thumb).
2. Create an API key. Restrict it to **Places API (New)** only. Do not use `NEXT_PUBLIC_*` — that would ship the key to the client. IP referrer restrictions are a poor fit for Vercel serverless; API restriction is the one that matters here.
3. Set `GOOGLE_PLACES_API_KEY` (or `GOOGLE_MAPS_API_KEY`) in `.env.local` locally, and in the Vercel project for Production, Preview, and Development.

Plate stores name, formatted address, `place_id`, and lat/lng when Google returns them. It does **not** import Google review text or Google star ratings. One Place Photo may appear as an identity thumb with the required author attribution and a Powered by Google mark on autocomplete. There is no map canvas.

## Cut

Booking, delivery, payments, maps-as-product, Maps SDK / pin UI, Google photos as a content feed, public review spam, influencer feeds, restaurant claims, AI recommendations.
