"use client";

// IMPORTANT: the order matters!
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css";
import "leaflet-defaulticon-compatibility";
import { institutions } from "@/app/data/institutions";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { LatLngExpression } from "leaflet";

export default function Map() {
    // Full semenanjung view coords: 3.8300, 101.4046, zoom: 7
    const position = {
        center: [3.1685, 101.6512] as LatLngExpression,
        marker: institutions
    }

    return (
        <MapContainer
            center={position.center}
            zoom={11}
            scrollWheelZoom={true}
            style={{ height: "240px", width: "965px" }}
        // className="w-full h-auto"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {
                position.marker.map((position, idx) => {
                    console.log(position.coords)
                    if (position.coords) return (
                        <Marker key={idx} position={position.coords as LatLngExpression}>
                            <Popup>
                                {position.name}
                            </Popup>
                        </Marker>
                    )
                })
            }
        </MapContainer>
    );
}