"use client";
import React from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import geojsonData from "../maps/floor_1.geo.json";

export default function Home() {
  return (
    <main>
      <MapContainer
        center={[50.2945, 18.6714]}
        zoom={13}
        style={{ height: "100vh", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <GeoJSON data={geojsonData} />
      </MapContainer>
    </main>
  );
}
