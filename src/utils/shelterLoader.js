// src/utils/shelterLoader.js
// loadAllShelters(): loads EVERY state file listed in public/shelters/index.json
//                    and merges them into one FeatureCollection (for the map).
// withinKm():        keeps only shelters within `radiusKm` of the user (for the list/route).

const R = 6371;
const rad = (d) => (d * Math.PI) / 180;

function km(a, b) {
    const dLat = rad(b.lat - a.lat);
    const dLon = rad(b.lon - a.lon);
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
}

let allCache = null;

export async function loadAllShelters() {
    if (allCache) return allCache;

    const res = await fetch('/shelters/index.json');
    if (!res.ok) throw new Error('index.json not found');
    const manifest = await res.json();

    const lists = await Promise.all(
        manifest.map(async (m) => {
            try {
                const r = await fetch(m.file);
                if (!r.ok) return [];
                const gj = await r.json();
                return gj.features || [];
            } catch {
                return []; // one broken state file should not hide the others
            }
        })
    );

    allCache = {
        type: 'FeatureCollection',
        features: lists.flat().filter((f) => f.geometry?.type === 'Point'),
    };
    return allCache;
}

export function withinKm(fc, location, radiusKm = 50) {
    const empty = { type: 'FeatureCollection', features: [] };
    if (!fc || !location) return empty;
    const p = { lat: location.lat, lon: location.lon ?? location.lng };
    return {
        type: 'FeatureCollection',
        features: fc.features.filter((f) => {
            const [lon, lat] = f.geometry.coordinates;
            return km(p, { lat, lon }) <= radiusKm;
        }),
    };
}