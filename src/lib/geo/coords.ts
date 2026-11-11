// Saisie de coordonnées GPS : formats décimaux usuels (Google Maps, Géoportail, GPS du téléphone) et DMS.
// Retourne { lat, lon } en WGS84, ou null si non reconnu / hors France (métropole + DROM).

const DMS = /(\d{1,3})\s*[°º]\s*(\d{1,2})\s*['’′]\s*(\d{1,2}(?:[.,]\d+)?)\s*(?:["”″]|'')?\s*([NSEWO])/gi;

export function parseCoords(input: string): { lat: number; lon: number } | null {
  const s = input.trim();
  if (!s) return null;
  // DMS : 49°52'49.4"N 2°14'18.6"E
  const dms = [...s.matchAll(DMS)];
  if (dms.length === 2) {
    const v = dms.map((m) => {
      const val = Number(m[1]) + Number(m[2]) / 60 + Number(m[3].replace(",", ".")) / 3600;
      const h = m[4].toUpperCase();
      return { val: h === "S" || h === "W" || h === "O" ? -val : val, isLat: h === "N" || h === "S" };
    });
    const lat = v.find((x) => x.isLat)?.val;
    const lon = v.find((x) => !x.isLat)?.val;
    return lat !== undefined && lon !== undefined ? check(lat, lon) : null;
  }
  // décimal : "49.8804, 2.2385" ; "49,8804 2,2385" ; "49.8804;2.2385"
  const nums = s.match(/-?\d+(?:[.,]\d+)?/g);
  if (!nums || nums.length !== 2) return null;
  const [a, b] = nums.map((x) => Number(x.replace(",", ".")));
  // ordre usuel lat, lon ; on tolère lon, lat si l'ordre est manifestement inversé (métropole : lat 41-51, lon -5..10)
  return check(a, b) ?? check(b, a);
}

function check(lat: number, lon: number) {
  const metro = lat >= 41 && lat <= 51.5 && lon >= -5.5 && lon <= 10;
  const drom =
    (lat >= 15.8 && lat <= 16.6 && lon >= -61.9 && lon <= -60.9) || // Guadeloupe
    (lat >= 14.3 && lat <= 14.9 && lon >= -61.3 && lon <= -60.7) || // Martinique
    (lat >= 2 && lat <= 6 && lon >= -54.7 && lon <= -51.5) || // Guyane
    (lat >= -21.5 && lat <= -20.8 && lon >= 55.2 && lon <= 55.9) || // La Réunion
    (lat >= -13.1 && lat <= -12.6 && lon >= 45 && lon <= 45.4); // Mayotte
  return metro || drom ? { lat, lon } : null;
}
