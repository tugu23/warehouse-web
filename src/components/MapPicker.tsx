import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Box, Typography, Paper } from '@mui/material';
import { LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in production
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapPickerProps {
  latitude?: number;
  longitude?: number;
  onChange: (latitude: number, longitude: number) => void;
  label?: string;
}

function LocationMarker({
  position,
  setPosition,
}: {
  position: LatLng | null;
  setPosition: (pos: LatLng) => void;
}) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : <Marker position={position} />;
}

export default function MapPicker({
  latitude,
  longitude,
  onChange,
  label = 'Select Location',
}: MapPickerProps) {
  const defaultCenter: LatLng = new LatLng(47.9189, 106.9174); // Ulaanbaatar, Mongolia
  const [position, setPosition] = useState<LatLng | null>(
    latitude && longitude ? new LatLng(latitude, longitude) : null
  );

  useEffect(() => {
    if (latitude && longitude) {
      setPosition(new LatLng(latitude, longitude));
    }
  }, [latitude, longitude]);

  const handlePositionChange = (pos: LatLng) => {
    setPosition(pos);
    onChange(pos.lat, pos.lng);
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        {label}
      </Typography>
      <Paper elevation={2}>
        <MapContainer
          center={position || defaultCenter}
          zoom={13}
          style={{ height: '400px', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={handlePositionChange} />
        </MapContainer>
      </Paper>
      {position && (
        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
          Coordinates: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
        </Typography>
      )}
      <Typography variant="caption" color="text.secondary" display="block">
        Click on the map to select a location
      </Typography>
    </Box>
  );
}
