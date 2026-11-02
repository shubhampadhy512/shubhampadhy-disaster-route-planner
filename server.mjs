// Live alerts API. Node 18+, no dependencies.
//   node server.mjs
//   http://localhost:3001/api/alerts
//   http://localhost:3001/api/alerts?state=kerala
//
// Each alert now also gets map shapes ("features"). Shapes come from, in order:
//   1) <polygon> tags inside the CAP file
//   2) the linked polygonUrl file (GeoJSON / XML / KML)
//   3) OPTIONAL fallback: district names matched against ./districts.geojson
// The response has a top-level "geojson" FeatureCollection for Leaflet.

import http from "node:http";
import fs from "node:fs";

const PORT = process.env.PORT || 3001;
const FEED_BASE = "https://sachet.ndma.gov.in/cap_public_website/rss/";
const TTL_MS = 5 * 60 * 1000;
const MAX_ALERTS = 40;
const BATCH = 10;
const DISTRICT_FILE = "./districts.geojson"; // optional, see README notes

const first = (xml, re) =>
    (xml.match(re) || [])[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim() ?? null;
const all = (xml, re) =>
    [...xml.matchAll(new RegExp(re.source, "g"))].map((m) => m[1].trim());

/* ---------- geometry helpers ---------- */

// "lat,lon lat,lon" or "lon,lat,0 lon,lat,0" -> [[lon,lat], ...]
// India: latitude < 40, longitude > 60, so we can detect the order.
function ringFromText(t) {
    const ring = [
        ...t.matchAll(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)(?:\s*,\s*-?\d+(?:\.\d+)?)?/g),
    ]
        .map((m) => [+m[1], +m[2]])
        .map(([a, b]) => (a > 40 ? [a, b] : [b, a]));
    if (ring.length > 2) {
        const [f, l] = [ring[0], ring[ring.length - 1]];
        if (f[0] !== l[0] || f[1] !== l[1]) ring.push([...f]); // close the ring
    }
    return ring;
}

function parsePolygonFile(text, props) {
    const t = text.trim();
    if (t.startsWith("{")) {
        const gj = JSON.parse(t);
        const list =
            gj.type === "FeatureCollection" ? gj.features
                : gj.type === "Feature" ? [gj]
                    : [{ type: "Feature", geometry: gj }];
        return list.map((f) => ({ ...f, properties: { ...props, ...f.properties } }));
    }
    const re =
        /<(?:\w+:)?(?:polygon|coordinates)[^>]*>([\s\S]*?)<\/(?:\w+:)?(?:polygon|coordinates)>/gi;
    const feats = [];
    for (const m of t.matchAll(re)) {
        const ring = ringFromText(m[1]);
        if (ring.length > 3)
            feats.push({
                type: "Feature",
                properties: props,
                geometry: { type: "Polygon", coordinates: [ring] },
            });
    }
    return feats;
}

/* ---------- optional district fallback ---------- */

let districtIndex = null; // normalizedName -> feature
const norm = (s) =>
    String(s || "")
        .toLowerCase()
        .replace(/\s+(districts?|talukas?|mandals?|zones?)\s+of\s+.*$/i, "")
        .replace(/\s+(districts?|talukas?|mandals?|zones?)$/i, "")
        .replace(/[^a-z]/g, "");

function loadDistricts() {
    if (districtIndex) return districtIndex;
    districtIndex = new Map();
    try {
        const gj = JSON.parse(fs.readFileSync(DISTRICT_FILE, "utf8"));
        for (const f of gj.features) {
            const p = f.properties || {};
            const name = p.DISTRICT || p.district || p.dtname || p.NAME_2 || p.name || p.Name;
            if (name) districtIndex.set(norm(name), f);
        }
        console.log(`districts.geojson loaded: ${districtIndex.size} districts`);
    } catch {
        console.log("No districts.geojson found (fallback disabled).");
    }
    return districtIndex;
}

function districtFeatures(a, props) {
    const idx = loadDistricts();
    if (!idx.size) return [];
    const names = (a.areas[0] || "").split(",").map(norm).filter(Boolean);
    const feats = [];
    for (const n of names) {
        const f = idx.get(n);
        if (f) feats.push({ type: "Feature", properties: props, geometry: f.geometry });
    }
    return feats;
}

let loggedPolygonSample = false;

async function loadGeometry(a, xml) {
    const props = {
        id: a.id,
        event: a.event,
        severity: a.severity,
        areaDesc: a.areas[0],
        headline: a.headline,
        expires: a.expires,
        sender: a.sender,
    };
    try {
        // 1) polygons inside the CAP file
        let feats = parsePolygonFile(xml, props);
        if (feats.length) return feats;

        // 2) linked polygon file
        if (a.polygonUrl) {
            const r = await fetch(a.polygonUrl);
            const text = await r.text();
            if (!loggedPolygonSample) {
                loggedPolygonSample = true;
                console.log(`polygonUrl -> HTTP ${r.status}, first 300 chars:\n${text.slice(0, 300)}\n`);
            }
            if (r.ok) feats = parsePolygonFile(text, props);
            if (feats.length) return feats;
        }
    } catch (e) {
        console.error("polygon failed:", a.id, e.message);
    }
    // 3) district-name fallback (approximate)
    return districtFeatures(a, props);
}

/* ---------- CAP + feed ---------- */

async function parseCap(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const alert = {
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
    alert.features = await loadGeometry(alert, xml);
    return alert;
}

const data = new Map();
const pending = new Map();

async function refresh(key) {
    const feed = key === "india" ? "rss_india.xml" : `rss_${key}.xml`;
    const res = await fetch(FEED_BASE + feed);
    if (!res.ok) throw new Error(`Feed ${feed} returned HTTP ${res.status}`);
    const rss = await res.text();
    const links = all(rss, /<item>[\s\S]*?<link>([\s\S]*?)<\/link>/).slice(0, MAX_ALERTS);

    const alerts = [];
    for (let i = 0; i < links.length; i += BATCH) {
        const results = await Promise.allSettled(links.slice(i, i + BATCH).map(parseCap));
        for (const r of results) {
            if (r.status === "fulfilled") alerts.push(r.value);
            else console.error("skip:", r.reason?.message);
        }
    }

    const now = Date.now();
    const active = alerts.filter((a) => !a.expires || new Date(a.expires).getTime() > now);
    data.set(key, { alerts: active, fetchedAt: now });
    const withShape = active.filter((a) => a.features.length).length;
    console.log(
        `[${new Date().toISOString()}] ${key}: ${active.length} active, ${withShape} with map shapes`
    );
}

async function getAlerts(key) {
    const d = data.get(key);
    if (d && Date.now() - d.fetchedAt < TTL_MS) return { ...d, stale: false };

    if (!pending.has(key)) {
        pending.set(key, refresh(key).finally(() => pending.delete(key)));
    }
    try {
        await pending.get(key);
    } catch (e) {
        console.error(`refresh ${key} failed:`, e.message);
    }

    const latest = data.get(key);
    if (!latest) throw new Error("SACHET unavailable and no cached data yet");
    return { ...latest, stale: Date.now() - latest.fetchedAt >= TTL_MS };
}

http
    .createServer(async (req, res) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        const url = new URL(req.url, "http://localhost");

        if (url.pathname !== "/api/alerts") {
            res.writeHead(404, { "Content-Type": "text/plain" });
            return res.end("Not found. Try /api/alerts");
        }

        const state = (url.searchParams.get("state") || "india").toLowerCase();
        if (!/^[a-z_]{2,40}$/.test(state)) {
            res.writeHead(400, { "Content-Type": "text/plain" });
            return res.end("Bad state name");
        }

        try {
            const r = await getAlerts(state);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
                JSON.stringify({
                    state,
                    fetchedAt: new Date(r.fetchedAt).toISOString(),
                    stale: r.stale,
                    count: r.alerts.length,
                    alerts: r.alerts.map(({ features, ...rest }) => ({
                        ...rest,
                        hasShape: features.length > 0,
                    })),
                    geojson: {
                        type: "FeatureCollection",
                        features: r.alerts.flatMap((a) => a.features),
                    },
                })
            );
        } catch (e) {
            res.writeHead(502, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
    })
    .listen(PORT, () => console.log(`Alerts API running: http://localhost:${PORT}/api/alerts`));
