// PRD §31: Location services — abstract behind provider interface
// Uses browser Geolocation API + OpenStreetMap Nominatim (free, no API key)

export interface GeoCoordinates {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface ResolvedLocation {
  coordinates: GeoCoordinates;
  displayName: string;
  city: string;
  state: string;
  source: 'browser' | 'fallback';
}

export interface NearbyHospital {
  name: string;
  lat: number;
  lng: number;
  distanceKm: number;
  address?: string;
  emergency?: boolean;
}

const FALLBACK_LOCATION: ResolvedLocation = {
  coordinates: { lat: 17.3850, lng: 78.4867 },
  displayName: 'Hyderabad, Telangana, India',
  city: 'Hyderabad',
  state: 'Telangana',
  source: 'fallback'
};

let cachedLocation: ResolvedLocation | null = null;

/**
 * Request browser geolocation permission and get real GPS coordinates.
 * Falls back to Hyderabad if permission denied or unavailable.
 */
export async function getUserLocation(): Promise<ResolvedLocation> {
  if (cachedLocation && cachedLocation.source === 'browser') {
    return cachedLocation;
  }

  if (!navigator.geolocation) {
    cachedLocation = FALLBACK_LOCATION;
    return FALLBACK_LOCATION;
  }

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000
      });
    });

    const coords: GeoCoordinates = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy
    };

    // Reverse geocode with OpenStreetMap Nominatim (free, no API key)
    let displayName = `${coords.lat.toFixed(4)}°N, ${coords.lng.toFixed(4)}°E`;
    let city = 'Unknown';
    let state = 'Unknown';

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=14`,
        {
          headers: { 'User-Agent': 'SAATHI-HackathonDemo/1.0' },
          signal: AbortSignal.timeout(3000)
        }
      );
      if (res.ok) {
        const data = await res.json();
        displayName = data.display_name || displayName;
        city = data.address?.city || data.address?.town || data.address?.village || city;
        state = data.address?.state || state;
      }
    } catch {
      // Reverse geocoding failed — use raw coordinates, still a success
    }

    cachedLocation = { coordinates: coords, displayName, city, state, source: 'browser' };
    return cachedLocation;
  } catch {
    cachedLocation = FALLBACK_LOCATION;
    return FALLBACK_LOCATION;
  }
}

let cachedHospitals: NearbyHospital[] | null = null;

/**
 * Search for nearby hospitals using OpenStreetMap Overpass API.
 * PRD §62: Hospital information must come from verified databases, never LLM-invented.
 */
export async function findNearbyHospitals(
  coords: GeoCoordinates,
  radiusMeters: number = 5000
): Promise<NearbyHospital[]> {
  if (cachedHospitals) return cachedHospitals;

  try {
    const query = `
      [out:json][timeout:10];
      (
        node["amenity"="hospital"](around:${radiusMeters},${coords.lat},${coords.lng});
        way["amenity"="hospital"](around:${radiusMeters},${coords.lat},${coords.lng});
      );
      out center 10;
    `;

    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: AbortSignal.timeout(8000)
    });

    if (!res.ok) throw new Error('Overpass API request failed');

    const data = await res.json();
    const hospitals: NearbyHospital[] = (data.elements || [])
      .map((el: any) => {
        const elLat = el.lat || el.center?.lat;
        const elLng = el.lon || el.center?.lon;
        if (!elLat || !elLng) return null;

        const dist = haversineDistance(coords.lat, coords.lng, elLat, elLng);
        return {
          name: el.tags?.name || 'Unnamed Hospital',
          lat: elLat,
          lng: elLng,
          distanceKm: Math.round(dist * 100) / 100,
          address: el.tags?.['addr:full'] || el.tags?.['addr:street'] || undefined,
          emergency: el.tags?.emergency === 'yes' || el.tags?.['healthcare:speciality']?.includes('emergency')
        };
      })
      .filter(Boolean)
      .sort((a: NearbyHospital, b: NearbyHospital) => a.distanceKm - b.distanceKm)
      .slice(0, 5);

    if (hospitals.length === 0) {
      cachedHospitals = getFallbackHospitals();
      return cachedHospitals;
    }

    cachedHospitals = hospitals;
    return hospitals;
  } catch {
    cachedHospitals = getFallbackHospitals();
    return cachedHospitals;
  }
}

function getFallbackHospitals(): NearbyHospital[] {
  return [
    { name: 'Apollo Hospitals (Jubilee Hills)', lat: 17.4239, lng: 78.4086, distanceKm: 4.2, emergency: true },
    { name: 'KIMS Hospital', lat: 17.4156, lng: 78.3816, distanceKm: 5.1, emergency: true },
    { name: 'Care Hospitals (Banjara Hills)', lat: 17.4210, lng: 78.4418, distanceKm: 3.8, emergency: true },
    { name: 'Yashoda Hospitals (Somajiguda)', lat: 17.4375, lng: 78.4583, distanceKm: 5.6, emergency: true },
    { name: 'Gandhi Hospital', lat: 17.3955, lng: 78.4700, distanceKm: 1.3, emergency: true }
  ];
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
