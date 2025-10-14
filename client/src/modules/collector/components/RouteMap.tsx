import React, { useEffect, useState } from "react";
import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  useJsApiLoader,
} from "@react-google-maps/api";

interface Bin {
  id: number;
  lat: number;
  lng: number;
  status: "pending" | "collected" | "skipped";
  name?: string;
}

interface RouteMapProps {
  bins?: Bin[];
  onMarkCollected?: (id: number) => void;
  onSkipBin?: (id: number) => void;
}

const RouteMap: React.FC<RouteMapProps> = ({ bins = [], onMarkCollected }) => {
  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);
  const [currentLocation, setCurrentLocation] =
    useState<google.maps.LatLngLiteral | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      });
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  }, []);

  // Calculate route
  useEffect(() => {
    if (!currentLocation || !isLoaded || bins.length === 0) return;

    const directionsService = new google.maps.DirectionsService();

    const pendingBins = bins.filter((b) => b.status === "pending");
    if (pendingBins.length === 0) return;

    const waypoints = pendingBins.map((b) => ({
      location: { lat: b.lat, lng: b.lng },
      stopover: true,
    }));

    directionsService.route(
      {
        origin: currentLocation,
        destination: waypoints[waypoints.length - 1].location,
        waypoints,
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK" && result) {
          setDirections(result);
        } else {
          console.error("Error fetching directions:", status);
        }
      }
    );
  }, [currentLocation, isLoaded, bins]);

  if (!isLoaded)
    return (
      <div className="flex items-center justify-center h-full text-gray-500 font-medium">
        Loading map...
      </div>
    );

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "100%" }}
      center={currentLocation || { lat: 6.9271, lng: 79.8612 }}
      zoom={13}
      options={{
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      }}
    >
      {/* Current Location */}
      {currentLocation && (
        <Marker
          position={currentLocation}
          title="Your Location"
          icon={{
            url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
          }}
        />
      )}

      {/* Bin Markers */}
      {bins.map((b, index) => {
        let iconUrl = "";
        if (b.status === "pending")
          iconUrl = "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
        else if (b.status === "collected")
          iconUrl = "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
        else if (b.status === "skipped")
          iconUrl = "http://maps.google.com/mapfiles/ms/icons/red-dot.png";

        return (
          <Marker
            key={b.id}
            position={{ lat: b.lat, lng: b.lng }}
            label={{
              text: `${index + 1}`,
              className: "text-white font-bold",
            }}
            icon={{ url: iconUrl }}
            onClick={() => {
              if (b.status === "pending" && onMarkCollected)
                onMarkCollected(b.id);
            }}
          />
        );
      })}

      {/* Route */}
      {directions && <DirectionsRenderer directions={directions} />}
    </GoogleMap>
  );
};

export default RouteMap;
