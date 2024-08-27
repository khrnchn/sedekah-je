"use client";

// IMPORTANT: the order matters!
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css";
import "leaflet-defaulticon-compatibility";
import { institutions } from "@/app/data/institutions";
import { CategoryColor, Institution } from "@/app/types/institutions";

import { MapContainer, Marker, Tooltip, TileLayer } from "react-leaflet";
import { Icon, type LatLngExpression } from "leaflet";
import Link from "next/link";
import { slugify } from "@/lib/utils";
import { useMemo } from "react";
import { useRouter } from "next/navigation";

type MarkerColor =
  | "blue"
  | "gold"
  | "red"
  | "green"
  | "orange"
  | "yellow"
  | "violet"
  | "grey"
  | "black";
export type MapMarker = {
  name: string;
  coords: [number, number];
  color?: MarkerColor;
};

export default function MapLocation({
  center = [3.1685, 101.6512],
  zoom = 11,
  marker,
}: {
  center?: number[];
  zoom?: number;
  marker?: MapMarker;
}) {
  // Full semenanjung view coords: 3.8300, 101.4046, zoom: 7
  const position = {
    center:
      (center as LatLngExpression) ?? ([3.1685, 101.6512] as LatLngExpression),
    marker: institutions,
  };

  const getMarkerIcon = (color?: MarkerColor) =>
    new Icon({
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      TooltipAnchor: [1, -34],
      shadowSize: [41, 41],
    });

  const router = useRouter();

  const markerClick = useMemo(
    () => ({
      click(e: Institution) {
        router.push(`/${e.category}/${slugify(e.name)}`);
      },
    }),
    [router],
  );

  if (marker) {
    return (
      <MapContainer
        center={position.center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-auto z-0 min-h-[240px] min-w-full rounded-md overflow-clip"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker
          position={marker.coords as LatLngExpression}
          icon={getMarkerIcon(marker.color ?? "blue")}
        >
          <Tooltip>{marker.name}</Tooltip>
        </Marker>
      </MapContainer>
    );
  }

  return (
    <MapContainer
      center={position.center}
      zoom={zoom}
      scrollWheelZoom={true}
      className="w-full h-auto z-0 min-h-[240px] min-w-full rounded-md overflow-clip"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {position.marker.map((position, idx) => {
        if (position.coords)
          return (
            <Marker
              key={idx}
              position={position.coords as LatLngExpression}
              icon={getMarkerIcon(CategoryColor[position.category])}
              eventHandlers={{
                click: () => markerClick.click(position),
              }}
            >
              <Tooltip>{position.name}</Tooltip>
            </Marker>
          );
      })}
    </MapContainer>
  );
}
