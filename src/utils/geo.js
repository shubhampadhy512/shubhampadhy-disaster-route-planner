// Straight-line distance between two [lat, lon] points, in kilometres.
export function haversineKm(a, b) {
    const rad = (d) => (d * Math.PI) / 180;
    const dLat = rad(b[0] - a[0]);
    const dLon = rad(b[1] - a[1]);
    const x =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2;
    return 2 * 6371 * Math.asin(Math.sqrt(x));
}

// location: { lat, lon }   shelters: GeoJSON FeatureCollection of Points
// Returns the closest shelters as { id, name, type, latlng: [lat, lon], km }.
export function nearestShelters(location, shelters, count = 5) {
    if (!location || !shelters) return [];
    const here = [location.lat, location.lon];
    return shelters.features
        .map((f) => {
            const [lon, lat] = f.geometry.coordinates;
            return {
                id: f.properties.id,
                name: f.properties.name,
                type: f.properties.type,
                latlng: [lat, lon],
                km: haversineKm(here, [lat, lon]),
            };
        })
        .sort((a, b) => a.km - b.km)
        .slice(0, count);
}