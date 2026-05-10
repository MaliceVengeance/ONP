"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

type Props = {
  city: string;
  state: string;
};

export default function ProjectMap({ city, state }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    // Geocode the city to get coordinates
    const geocode = async () => {
      try {
        const query = encodeURIComponent(`${city}, ${state}, USA`);
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${mapboxgl.accessToken}&types=place&limit=1`
        );
        const data = await res.json();

        if (!data.features?.length) return;

        const [lng, lat] = data.features[0].center;

        // Initialize map centered on city
        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: "mapbox://styles/mapbox/dark-v11",
          center: [lng, lat],
          zoom: 11,
          interactive: false, // disable pan/zoom for cleaner look
        });

        map.current.on("load", () => {
          if (!map.current) return;

          // Add a circle to show general area
          map.current.addSource("area", {
            type: "geojson",
            data: {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [lng, lat],
              },
              properties: {},
            },
          });

          // Filled circle
          map.current.addLayer({
            id: "area-fill",
            type: "circle",
            source: "area",
            paint: {
              "circle-radius": {
                stops: [
                  [0, 0],
                  [20, metersToPixelsAtMaxZoom(1500, lat)],
                ],
                base: 2,
              },
              "circle-color": "#C8102E",
              "circle-opacity": 0.15,
            },
          });

          // Circle border
          map.current.addLayer({
            id: "area-border",
            type: "circle",
            source: "area",
            paint: {
              "circle-radius": {
                stops: [
                  [0, 0],
                  [20, metersToPixelsAtMaxZoom(1500, lat)],
                ],
                base: 2,
              },
              "circle-color": "transparent",
              "circle-stroke-width": 2,
              "circle-stroke-color": "#C8102E",
              "circle-opacity": 0,
            },
          });
        });
      } catch (err) {
        console.error("Map geocoding failed:", err);
      }
    };

    geocode();

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [city, state]);

  return (
    <div style={{
      background: "#0F2040",
      border: "1px solid #1B4F8A",
      borderRadius: "10px",
      overflow: "hidden",
      marginBottom: "16px",
    }}>
      <div style={{
        padding: "12px 18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #1B4F8A",
      }}>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "14px",
          letterSpacing: "1px",
          color: "#fff",
          textTransform: "uppercase",
        }}>
          📍 General Area
        </div>
        <div style={{ fontSize: "11px", color: "#3A5A7A" }}>
          Approximate location only
        </div>
      </div>
      <div
        ref={mapContainer}
        style={{ height: "240px", width: "100%" }}
      />
      <div style={{
        padding: "8px 18px",
        fontSize: "11px",
        color: "#3A5A7A",
        textAlign: "center",
      }}>
        Exact address revealed only after project is awarded
      </div>
    </div>
  );
}

// Helper to convert meters to pixels at max zoom
function metersToPixelsAtMaxZoom(meters: number, latitude: number) {
  return meters / 0.075 / Math.cos((latitude * Math.PI) / 180);
}