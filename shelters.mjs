// Saves shelters for ONE state as a separate file. Node 18+, no dependencies.
//
//   node shelters.mjs IN-OD odisha
//   node shelters.mjs IN-KL kerala
//
// Output: public/shelters/<name>.geojson  (the "public" folder of your React app)
//
// Some state codes (ISO 3166-2): IN-OD Odisha, IN-KL Kerala, IN-MH Maharashtra,
// IN-TN Tamil Nadu, IN-AP Andhra Pradesh, IN-WB West Bengal, IN-GJ Gujarat.

import { mkdir, writeFile } from "node:fs/promises";

const [iso, name] = process.argv.slice(2);
if (!iso || !name) {
  console.log("Usage: node shelters.mjs IN-OD odisha");
  process.exit(1);
}

const q = `[out:json][timeout:120];
area["ISO3166-2"="${iso}"]->.a;
(
  nwr["amenity"="shelter"](area.a);
  nwr["emergency"="assembly_point"](area.a);
  nwr["social_facility"="shelter"](area.a);
);
out center tags;`;

const servers = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

let elements = null;
for (const url of servers) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "disaster-alert-project/1.0",
      },
      body: "data=" + encodeURIComponent(q),
    });
    const text = await res.text();
    if (!res.ok || text.trim().startsWith("<")) {
      console.error(`${url} failed (${res.status})`);
      continue;
    }
    elements = JSON.parse(text).elements;
    break;
  } catch (e) {
    console.error(`${url} error:`, e.message);
  }
}
if (!elements) {
  console.error("All Overpass servers failed. Try again in a few minutes.");
  process.exit(1);
}

const features = elements
  .map((el) => {
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (lat == null || lon == null) return null;
    return {
      type: "Feature",
      geometry: { type: "Point", coordinates: [lon, lat] },
      properties: {
        id: `osm-${el.type}-${el.id}`,
        name: el.tags?.name ?? "Unnamed shelter",
        type: el.tags?.amenity ?? el.tags?.emergency ?? "shelter",
        state: name,
        source: "OpenStreetMap",
        verified: false,
        last_verified: null,
      },
    };
  })
  .filter(Boolean);

await mkdir("public/shelters", { recursive: true });
const file = `public/shelters/${name}.geojson`;
await writeFile(file, JSON.stringify({ type: "FeatureCollection", features }));
console.log(`Saved ${features.length} shelters to ${file}`);
