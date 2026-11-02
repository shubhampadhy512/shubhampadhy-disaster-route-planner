// Node 18+ (built-in fetch). No dependencies.
//
//   node tools.mjs alerts
//   node tools.mjs shelters south,west,north,east
//
// Run on your computer or a server, NOT in the browser (SACHET has no CORS).

import { writeFile } from "node:fs/promises";

const RSS_URL = "https://sachet.ndma.gov.in/cap_public_website/rss/rss_india.xml";

// Always-global matching, so matchAll can never throw the "non-global" error.
const first = (xml, re) =>
  (xml.match(re) || [])[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim() ?? null;
const all = (xml, re) =>
  [...xml.matchAll(new RegExp(re.source, "g"))].map((m) => m[1].trim());

async function parseCap(url) {
  const res = await fetch(url);
  const xml = await res.text();
  return {
    id: first(xml, /<cap:identifier>([\s\S]*?)<\/cap:identifier>/),
    sender: first(xml, /<cap:sender>([\s\S]*?)<\/cap:sender>/),
    sent: first(xml, /<cap:sent>([\s\S]*?)<\/cap:sent>/),
    status: first(xml, /<cap:status>([\s\S]*?)<\/cap:status>/),
    msgType: first(xml, /<cap:msgType>([\s\S]*?)<\/cap:msgType>/),
    event: first(xml, /<cap:event>([\s\S]*?)<\/cap:event>/),
    severity: first(xml, /<cap:severity>([\s\S]*?)<\/cap:severity>/),
    urgency: first(xml, /<cap:urgency>([\s\S]*?)<\/cap:urgency>/),
    certainty: first(xml, /<cap:certainty>([\s\S]*?)<\/cap:certainty>/),
    effective: first(xml, /<cap:effective>([\s\S]*?)<\/cap:effective>/),
    expires: first(xml, /<cap:expires>([\s\S]*?)<\/cap:expires>/),
    headline: first(xml, /<cap:headline>([\s\S]*?)<\/cap:headline>/),
    areas: all(xml, /<cap:areaDesc>([\s\S]*?)<\/cap:areaDesc>/),
    polygonUrl: first(
      xml,
      /Polygon URL<\/cap:valueName>\s*<cap:value>([\s\S]*?)<\/cap:value>/
    ),
    sourceUrl: url,
  };
}

async function fetchAlerts(limit = 30) {
  const rss = await (await fetch(RSS_URL)).text();
  const links = all(rss, /<item>[\s\S]*?<link>([\s\S]*?)<\/link>/);
  console.log(`Found ${links.length} alerts in the feed, reading ${Math.min(limit, links.length)}...`);
  const alerts = [];
  for (const link of links.slice(0, limit)) {
    try {
      alerts.push(await parseCap(link));
    } catch (e) {
      console.error("skip", link, e.message);
    }
  }
  return alerts;
}

async function fetchOsmShelters(bbox) {
  const q = `[out:json][timeout:60];
(
  nwr["amenity"="shelter"](${bbox});
  nwr["emergency"="assembly_point"](${bbox});
  nwr["social_facility"="shelter"](${bbox});
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
  if (!elements) throw new Error("All Overpass servers failed. Try again later.");

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
          source: "OpenStreetMap",
          verified: false,
          last_verified: null,
        },
      };
    })
    .filter(Boolean);
  return { type: "FeatureCollection", features };
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === "alerts") {
  const alerts = await fetchAlerts();
  await writeFile("alerts.json", JSON.stringify(alerts, null, 2));
  console.log(`Saved ${alerts.length} alerts to alerts.json`);
} else if (cmd === "shelters" && arg) {
  const fc = await fetchOsmShelters(arg);
  await writeFile("shelters.osm.geojson", JSON.stringify(fc));
  console.log(`Saved ${fc.features.length} shelters to shelters.osm.geojson`);
} else {
  console.log("Usage:\n  node tools.mjs alerts\n  node tools.mjs shelters south,west,north,east");
}
