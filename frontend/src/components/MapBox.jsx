import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || "";

export default function MapBox({ center, markerCoords, zoom = 12, style = { height: "100%", width: "100%" } }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [center.lng, center.lat],
      zoom: zoom,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    markerRef.current = new mapboxgl.Marker({ color: "var(--terracotta)" })
      .setLngLat([markerCoords.lng, markerCoords.lat])
      .addTo(mapRef.current);

    return () => mapRef.current.remove();
  }, []);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLngLat([markerCoords.lng, markerCoords.lat]);
    }
  }, [markerCoords]);

  return <div ref={mapContainerRef} style={style} className="mapbox-container" />;
}
