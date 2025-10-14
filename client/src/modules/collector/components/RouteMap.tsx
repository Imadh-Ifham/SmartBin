import React, { useEffect, useState } from "react";
import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  useJsApiLoader,
} from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "100vh",
};

const RouteMap: React.FC = () => {
  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);
  const [currentLocation, setCurrentLocation] =
    useState<google.maps.LatLngLiteral | null>(null);

  // Example locations to visit (bins)
  const locations = [
    { lat: 6.9344, lng: 79.8428 },
    { lat: 6.94, lng: 79.86 },
    { lat: 6.95, lng: 79.87 },
  ];

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  // Get current device location
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

  // Calculate route when current location is available
  useEffect(() => {
    if (!currentLocation || !isLoaded) return;

    const directionsService = new google.maps.DirectionsService();

    // Waypoints are all locations except start and end
    const waypoints = locations.map((loc) => ({
      location: loc,
      stopover: true,
    }));

    directionsService.route(
      {
        origin: currentLocation,
        destination: locations[locations.length - 1],
        waypoints,
        optimizeWaypoints: true, // <-- automatically finds the best route order
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
  }, [currentLocation, isLoaded]);

  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={currentLocation || { lat: 6.9271, lng: 79.8612 }}
      zoom={13}
    >
      {currentLocation && (
        <Marker
          position={currentLocation}
          title="Your Location"
          icon="http://maps.google.com/mapfiles/ms/icons/green-dot.png"
        />
      )}

      {!directions &&
        locations.map((loc, index) => (
          <Marker key={index} position={loc} label={`${index + 1}`} />
        ))}

      {directions && <DirectionsRenderer directions={directions} />}
    </GoogleMap>
  );
};

export default RouteMap;
