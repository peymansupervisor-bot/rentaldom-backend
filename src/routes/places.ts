import { Router } from 'express';
import { requireAuth } from '../middleware/auth';

const router = Router();
const PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY ?? '';

// ─── GET /places/autocomplete?input=123+main&sessiontoken=xxx ────────────────
router.get('/autocomplete', requireAuth, async (req, res): Promise<void> => {
  const { input, sessiontoken } = req.query as { input?: string; sessiontoken?: string };

  if (!input || input.trim().length < 2) {
    res.json({ predictions: [] });
    return;
  }

  if (!PLACES_KEY) {
    res.status(503).json({ error: 'Places API not configured' });
    return;
  }

  try {
    const params = new URLSearchParams({
      input: input.trim(),
      types: 'address',
      components: 'country:us',
      key: PLACES_KEY,
      ...(sessiontoken ? { sessiontoken } : {}),
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`
    );
    const data = await response.json() as any;

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Places autocomplete error:', data.status, data.error_message);
      res.status(502).json({ error: 'Places API error', status: data.status });
      return;
    }

    const predictions = (data.predictions ?? []).map((p: any) => ({
      placeId: p.place_id,
      description: p.description,
      mainText: p.structured_formatting?.main_text ?? p.description,
      secondaryText: p.structured_formatting?.secondary_text ?? '',
    }));

    res.json({ predictions });
  } catch (err: any) {
    console.error('Places fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

// ─── GET /places/details?placeId=xxx&sessiontoken=xxx ───────────────────────
// Returns structured address components so the app can auto-fill city/state/zip
router.get('/details', requireAuth, async (req, res): Promise<void> => {
  const { placeId, sessiontoken } = req.query as { placeId?: string; sessiontoken?: string };

  if (!placeId) {
    res.status(400).json({ error: 'placeId is required' });
    return;
  }

  if (!PLACES_KEY) {
    res.status(503).json({ error: 'Places API not configured' });
    return;
  }

  try {
    const params = new URLSearchParams({
      place_id: placeId,
      fields: 'address_components,formatted_address,geometry',
      key: PLACES_KEY,
      ...(sessiontoken ? { sessiontoken } : {}),
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${params}`
    );
    const data = await response.json() as any;

    if (data.status !== 'OK') {
      res.status(502).json({ error: 'Places API error', status: data.status });
      return;
    }

    const components: Record<string, string> = {};
    for (const comp of data.result.address_components ?? []) {
      for (const type of comp.types) {
        components[type] = comp.short_name ?? comp.long_name;
        if (type === 'administrative_area_level_1') {
          components['state'] = comp.short_name;  // e.g. "CA"
        }
        if (type === 'locality') {
          components['city'] = comp.long_name;
        }
        if (type === 'postal_code') {
          components['zip'] = comp.long_name;
        }
      }
    }

    // Build street address (number + street name)
    const streetNumber = components['street_number'] ?? '';
    const route = components['route'] ?? '';
    const street = [streetNumber, route].filter(Boolean).join(' ');

    res.json({
      formattedAddress: data.result.formatted_address,
      street,
      city: components['city'] ?? components['sublocality_level_1'] ?? '',
      state: components['state'] ?? '',
      zip: components['zip'] ?? '',
      lat: data.result.geometry?.location?.lat ?? null,
      lng: data.result.geometry?.location?.lng ?? null,
    });
  } catch (err: any) {
    console.error('Places details error:', err);
    res.status(500).json({ error: 'Failed to fetch place details' });
  }
});

export default router;
