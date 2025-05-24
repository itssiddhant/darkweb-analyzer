// src/components/charts/GeoMap.jsx
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const GeoMap = ({ data }) => {
  if (!data || !data.data || !data.data.points || data.data.points.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <p className="text-gray-400">No geolocation data available</p>
      </div>
    );
  }

  const { points } = data.data;

  // Calculate center point for the map
  const center = points.length > 0
    ? {
        lat: points.reduce((sum, point) => sum + point.lat, 0) / points.length,
        lng: points.reduce((sum, point) => sum + point.lng, 0) / points.length
      }
    : { lat: 0, lng: 0 };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-medium text-white mb-4">{data.data.title}</h3>
      <div className="h-[400px] rounded-lg overflow-hidden">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={2}
          style={{ height: '100%', width: '100%' }}
          className="rounded-lg"
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          {points.map((point, index) => (
            <Marker
              key={`marker-${index}`}
              position={[point.lat, point.lng]}
            >
              <Popup>
                <div className="text-gray-800">
                  <p className="font-medium">{point.city || 'Unknown City'}</p>
                  <p>{point.country || 'Unknown Country'}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default GeoMap;