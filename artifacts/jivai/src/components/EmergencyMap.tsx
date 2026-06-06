import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";

type NearbyPlace = {
  name: string;
  amenity: string;
  distKm: number;
  lat: number;
  lng: number;
  phone: string | null;
  address: string | null;
};

type Props = {
  lat: number;
  lng: number;
  accuracy?: number;
  nearbyPlaces?: NearbyPlace[];
};

export default function EmergencyMap({ lat, lng, accuracy, nearbyPlaces = [] }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return;

      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current!, { zoomControl: true, attributionControl: false }).setView(
        [lat, lng],
        15
      );
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      const youIcon = L.divIcon({
        html: `<div style="width:16px;height:16px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 0 0 3px rgba(239,68,68,0.4);animation:pulse 1.5s infinite;"></div>`,
        className: "",
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      L.marker([lat, lng], { icon: youIcon })
        .addTo(map)
        .bindPopup("<b>You are here</b>")
        .openPopup();

      if (accuracy && accuracy < 500) {
        L.circle([lat, lng], {
          radius: accuracy,
          color: "#3b82f6",
          fillColor: "#3b82f6",
          fillOpacity: 0.08,
          weight: 1,
        }).addTo(map);
      }

      nearbyPlaces.forEach((place) => {
        const emoji =
          place.amenity === "fire_station" ? "🚒"
          : place.amenity === "police" ? "🚔"
          : "🏥";

        const placeIcon = L.divIcon({
          html: `<div style="font-size:22px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.5));">${emoji}</div>`,
          className: "",
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const distLabel =
          place.distKm < 1
            ? `${Math.round(place.distKm * 1000)} m away`
            : `${place.distKm} km away`;

        const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${place.lat},${place.lng}&travelmode=driving`;

        L.marker([place.lat, place.lng], { icon: placeIcon })
          .addTo(map)
          .bindPopup(
            `<div style="font-family:sans-serif;min-width:160px;">
              <p style="font-weight:700;margin:0 0 2px;">${place.name}</p>
              ${place.address ? `<p style="font-size:11px;color:#666;margin:0 0 4px;">${place.address}</p>` : ""}
              <p style="font-size:12px;color:#ef4444;font-weight:600;margin:0 0 6px;">${distLabel}</p>
              <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer"
                style="display:inline-block;font-size:12px;background:#ef4444;color:white;padding:4px 10px;border-radius:6px;text-decoration:none;font-weight:600;">
                Directions →
              </a>
              ${place.phone ? `<a href="tel:${place.phone.replace(/[^0-9+]/g, "")}" style="display:inline-block;font-size:12px;background:#1d4ed8;color:white;padding:4px 10px;border-radius:6px;text-decoration:none;font-weight:600;margin-left:4px;">Call</a>` : ""}
            </div>`
          );
      });

      if (nearbyPlaces.length > 0) {
        const allLats = [lat, ...nearbyPlaces.map((p) => p.lat)];
        const allLngs = [lng, ...nearbyPlaces.map((p) => p.lng)];
        const bounds = L.latLngBounds(
          [Math.min(...allLats), Math.min(...allLngs)],
          [Math.max(...allLats), Math.max(...allLngs)]
        );
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    import("leaflet").then((L) => {
      if (!mapRef.current) return;
      if (nearbyPlaces.length > 0) {
        const allLats = [lat, ...nearbyPlaces.map((p) => p.lat)];
        const allLngs = [lng, ...nearbyPlaces.map((p) => p.lng)];
        const bounds = L.latLngBounds(
          [Math.min(...allLats), Math.min(...allLngs)],
          [Math.max(...allLats), Math.max(...allLngs)]
        );
        mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      }
    });
  }, [nearbyPlaces]);

  return (
    <div
      ref={containerRef}
      style={{ height: "260px", width: "100%", borderRadius: "12px", overflow: "hidden" }}
      className="border border-border"
    />
  );
}
