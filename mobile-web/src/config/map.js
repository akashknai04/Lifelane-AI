import L from 'leaflet';

let hasWarnedMissingKey = false;

export const MAPTILER_ATTRIBUTION =
  '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>';

export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>';

export const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

/**
 * Returns configuration for Leaflet TileLayer.
 * Falls back to OpenStreetMap tiles if VITE_MAP_API_KEY is missing or empty.
 *
 * @param {string} [style='streets-v2'] - MapTiler map style (e.g. 'streets-v2', 'dataviz-dark')
 * @returns {{ url: string, tileSize: number, zoomOffset: number, attribution: string, maxZoom: number, isFallback: boolean }}
 */
export function getMapTileConfig(style = 'streets-v2') {
  const rawKey =
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_MAP_API_KEY) ||
    (typeof process !== 'undefined' && process.env && process.env.VITE_MAP_API_KEY) ||
    '';
  const apiKey = typeof rawKey === 'string' ? rawKey.trim() : '';

  if (!apiKey) {
    if (!hasWarnedMissingKey) {
      console.warn('MapTiler API key (VITE_MAP_API_KEY) is missing or empty. Falling back to OpenStreetMap tiles.');
      hasWarnedMissingKey = true;
    }
    return {
      url: OSM_TILE_URL,
      tileSize: 256,
      zoomOffset: 0,
      attribution: OSM_ATTRIBUTION,
      maxZoom: 19,
      isFallback: true,
    };
  }

  return {
    url: `https://api.maptiler.com/maps/${style}/{z}/{x}/{y}.png?key=${apiKey}`,
    tileSize: 512,
    zoomOffset: -1,
    attribution: MAPTILER_ATTRIBUTION,
    maxZoom: 19,
    isFallback: false,
  };
}

/**
 * Helper to instantiate a Leaflet TileLayer configured with MapTiler / OSM fallback.
 *
 * @param {string} [style='streets-v2']
 * @param {object} [options={}]
 * @returns {L.TileLayer}
 */
export function createTileLayer(style = 'streets-v2', options = {}) {
  const config = getMapTileConfig(style);
  return L.tileLayer(config.url, {
    attribution: config.attribution,
    tileSize: config.tileSize,
    zoomOffset: config.zoomOffset,
    maxZoom: 19,
    ...options,
  });
}
