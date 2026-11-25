import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Building2,
  Phone,
  MapPin,
  Navigation,
  Globe,
  Clock,
  Search,
  X,
  Filter,
  Compass,
  Map as MapIcon,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export const NearbyBloodBanksPage = () => {
  // State
  const [campusConfig, setCampusConfig] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLocation, setActiveLocation] = useState(null);
  const [radiusKm, setRadiusKm] = useState(10);
  const [facilityType, setFacilityType] = useState('all'); // 'all', 'hospitals', 'blood_banks'
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState('');
  const [showMap, setShowMap] = useState(true);

  // Map references
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const facilityMarkersRef = useRef({});

  // 1. Fetch Default Campus Configuration on Mount
  useEffect(() => {
    const initCampus = async () => {
      try {
        const { data } = await api.get('/nearby-facilities/default-campus');
        if (data.success && data.configured && data.campus) {
          setCampusConfig(data.campus);
          setSearchQuery(data.campus.name);
          const initialLoc = {
            query: data.campus.name,
            displayName: data.campus.address || data.campus.name,
            latitude: data.campus.latitude,
            longitude: data.campus.longitude
          };
          setActiveLocation(initialLoc);
          fetchNearbyFacilities(initialLoc.latitude, initialLoc.longitude, radiusKm, facilityType);
        } else {
          // If not configured, set default search query prompt
          setSearchQuery('');
        }
      } catch (err) {
        console.error('Failed to load campus configuration:', err);
      }
    };

    initCampus();
  }, []);

  // 2. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || !showMap) return;

    if (!mapInstanceRef.current) {
      const defaultLat = activeLocation?.latitude || 28.3676;
      const defaultLon = activeLocation?.longitude || 77.3159;

      const map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLon],
        zoom: 13,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [showMap]);

  // 3. Update Markers when facilities or active location change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    facilityMarkersRef.current = {};

    const bounds = L.latLngBounds();

    // Add active searched campus marker
    if (activeLocation?.latitude && activeLocation?.longitude) {
      const campusLatLng = [activeLocation.latitude, activeLocation.longitude];
      bounds.extend(campusLatLng);

      const campusIcon = L.divIcon({
        className: 'custom-campus-pin',
        html: `<div style="background-color: #059669; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.35); border: 2.5px solid white; font-size: 16px;">🎓</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -17]
      });

      L.marker(campusLatLng, { icon: campusIcon })
        .bindPopup(`
          <div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
            <span style="background: #ecfdf5; color: #065f46; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-bottom: 4px;">📍 SEARCHED CAMPUS / LOCATION</span>
            <strong style="display: block; font-size: 13px; color: #0f172a;">${activeLocation.displayName || activeLocation.query}</strong>
          </div>
        `)
        .addTo(markersLayerRef.current);
    }

    // Add facility markers
    facilities.forEach((f) => {
      if (f.latitude == null || f.longitude == null) return;
      const fLatLng = [f.latitude, f.longitude];
      bounds.extend(fLatLng);

      const isBloodBank = f.type === 'Blood Bank';
      const bgColor = isBloodBank ? '#dc2626' : (f.isPartner ? '#7c3aed' : '#2563eb');

      const icon = L.divIcon({
        className: 'custom-facility-pin',
        html: `<div style="background-color: ${bgColor}; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(0,0,0,0.3); border: 2.5px solid white; font-size: 13px;">${isBloodBank ? '🩸' : '🏥'}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15]
      });

      const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${f.latitude},${f.longitude}`;

      const marker = L.marker(fLatLng, { icon })
        .bindPopup(`
          <div style="font-family: inherit; font-size: 12px; line-height: 1.4; min-width: 180px;">
            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
              <span style="background: ${isBloodBank ? '#fee2e2; color: #991b1b;' : '#dbeafe; color: #1e40af;'} font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px;">${f.type}</span>
              ${f.isPartner ? '<span style="background: #f3e8ff; color: #6b21a8; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px;">Partner</span>' : ''}
              <span style="font-size: 11px; font-weight: 700; color: #059669; margin-left: auto;">${f.distance} km</span>
            </div>
            <strong style="display: block; font-size: 13px; color: #0f172a; margin-bottom: 2px;">${f.name}</strong>
            <p style="color: #64748b; font-size: 11px; margin: 0 0 6px 0;">${f.address}</p>
            ${f.phone ? `<p style="font-size: 11px; margin: 0 0 4px 0;"><strong>Phone:</strong> <a href="tel:${f.phone}" style="color: #dc2626; text-decoration: underline;">${f.phone}</a></p>` : ''}
            <div style="padding-top: 4px; border-top: 1px solid #e2e8f0; margin-top: 4px;">
              <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" style="color: #dc2626; font-weight: bold; text-decoration: underline; font-size: 11px;">Get Directions ↗</a>
            </div>
          </div>
        `)
        .addTo(markersLayerRef.current);

      facilityMarkersRef.current[f.id] = marker;
    });

    if (bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [35, 35], maxZoom: 15 });
    }
  }, [facilities, activeLocation, showMap]);

  // 4. Fetch Nearby Facilities around Coordinates
  const fetchNearbyFacilities = async (lat, lon, radius, type) => {
    try {
      setLoading(true);
      setError('');
      const params = { lat, lon, radius, type };
      const { data } = await api.get('/nearby-facilities/search', { params });
      if (data.success) {
        setFacilities(data.facilities || []);
      }
    } catch (err) {
      console.error('Failed to fetch nearby facilities:', err);
      setError(err.response?.data?.message || 'Could not retrieve nearby healthcare facilities. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Handle Geocode and Search Submission
  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      setError('Please enter a college name, campus address, city, or PIN code.');
      return;
    }

    try {
      setGeocoding(true);
      setError('');
      const { data } = await api.get('/nearby-facilities/geocode', { params: { query } });
      if (data.success && data.location) {
        const loc = data.location;
        setActiveLocation(loc);
        fetchNearbyFacilities(loc.latitude, loc.longitude, radiusKm, facilityType);
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      setError(err.response?.data?.message || `Could not find coordinates for "${query}". Try searching by city name (e.g. Faridabad, Delhi) or 6-digit PIN code.`);
    } finally {
      setGeocoding(false);
    }
  };

  // 6. Quick Reset to Configured Campus Location
  const handleUseCampusLocation = () => {
    if (!campusConfig) return;
    setSearchQuery(campusConfig.name);
    const loc = {
      query: campusConfig.name,
      displayName: campusConfig.address || campusConfig.name,
      latitude: campusConfig.latitude,
      longitude: campusConfig.longitude
    };
    setActiveLocation(loc);
    fetchNearbyFacilities(loc.latitude, loc.longitude, radiusKm, facilityType);
  };

  // 7. Use Browser GPS
  const handleUseCurrentGPS = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setGeocoding(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const loc = {
          query: 'My Current Location',
          displayName: `GPS: ${lat.toFixed(4)}, ${lon.toFixed(4)}`,
          latitude: lat,
          longitude: lon
        };
        setActiveLocation(loc);
        setSearchQuery(`Current Location (${lat.toFixed(2)}, ${lon.toFixed(2)})`);
        setGeocoding(false);
        fetchNearbyFacilities(lat, lon, radiusKm, facilityType);
      },
      (err) => {
        setGeocoding(false);
        setError('Unable to retrieve your current location. Please type your college or city name above.');
      },
      { timeout: 7000 }
    );
  };

  // 8. Focus Map on a specific facility marker
  const handleFocusOnMap = (facility) => {
    if (!mapInstanceRef.current || facility.latitude == null || facility.longitude == null) return;
    setShowMap(true);
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([facility.latitude, facility.longitude], 15);
        const marker = facilityMarkersRef.current[facility.id];
        if (marker) {
          marker.openPopup();
        }
      }
      if (mapContainerRef.current) {
        mapContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // 9. When Radius or Facility Type changes
  const handleRadiusChange = (newRadius) => {
    const r = Number(newRadius);
    setRadiusKm(r);
    if (activeLocation?.latitude && activeLocation?.longitude) {
      fetchNearbyFacilities(activeLocation.latitude, activeLocation.longitude, r, facilityType);
    }
  };

  const handleFacilityTypeChange = (newType) => {
    setFacilityType(newType);
    if (activeLocation?.latitude && activeLocation?.longitude) {
      fetchNearbyFacilities(activeLocation.latitude, activeLocation.longitude, radiusKm, newType);
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Nearby Hospitals & Blood Banks
            </h1>
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blood-50 text-blood-700 border border-blood-100">
              <Compass className="w-3 h-3 text-blood-600" />
              <span>Real Location Discovery</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Discover verified healthcare facilities, blood banks, and emergency transfusion centers around your campus
          </p>
        </div>

        {campusConfig && (
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleUseCampusLocation}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-2xs"
              title="Reset location to your campus default"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Campus Default: {campusConfig.name.split(',')[0]}</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Location Search Bar & Controls */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter college name, campus address, city, or PIN code (e.g. JC Bose University, Faridabad, 121001)..."
              className="w-full pl-9 pr-8 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-red-500 focus:bg-white transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              type="submit"
              disabled={geocoding || loading}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{geocoding ? 'Locating...' : 'Search Location'}</span>
            </button>

            <button
              type="button"
              onClick={handleUseCurrentGPS}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              title="Use current GPS position"
            >
              <Navigation className="w-4 h-4 text-slate-600" />
            </button>

            <button
              type="button"
              onClick={() => setShowMap(!showMap)}
              className={`p-2.5 rounded-xl text-xs font-bold transition-colors border ${
                showMap
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
              title="Toggle Interactive Map"
            >
              <MapIcon className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Filters Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Radius Selector */}
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Radius:</span>
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                {[5, 10, 25, 50].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleRadiusChange(r)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                      radiusKm === r
                        ? 'bg-red-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {r} km
                  </button>
                ))}
              </div>
            </div>

            {/* Facility Type Filter */}
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Filter:</span>
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                {[
                  { id: 'all', label: 'All Facilities' },
                  { id: 'hospitals', label: 'Hospitals' },
                  { id: 'blood_banks', label: 'Blood Banks' }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleFacilityTypeChange(t.id)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                      facilityType === t.id
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Search Label / Result Count */}
          {activeLocation && (
            <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
              <span className="font-semibold text-slate-700 truncate max-w-xs md:max-w-md">
                📍 {activeLocation.displayName || activeLocation.query}
              </span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                {facilities.length} found ({radiusKm} km)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. Interactive Leaflet Map */}
      {showMap && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 font-bold text-slate-700">
              <MapIcon className="w-3.5 h-3.5 text-blood-600" />
              <span>Campus & Facility Geographic Map</span>
            </div>
            <div className="flex items-center space-x-3 text-[10px] font-bold">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span className="text-slate-600">Searched Campus</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                <span className="text-slate-600">Blood Bank</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span className="text-slate-600">Hospital</span>
              </span>
            </div>
          </div>

          <div
            ref={mapContainerRef}
            className="w-full h-72 sm:h-80 z-0 bg-slate-100"
            style={{ minHeight: '280px' }}
          />
        </div>
      )}

      {/* 4. Facilities List / Cards */}
      {loading ? (
        <LoadingSpinner text="Searching genuine nearby healthcare facilities and blood banks via OpenStreetMap..." />
      ) : !activeLocation ? (
        <div className="bg-white p-10 text-center rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="w-10 h-10 rounded-full bg-blood-50 text-blood-600 flex items-center justify-center mx-auto">
            <Compass className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Ready to Locate Nearby Healthcare Facilities</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Enter your college name, campus address, city, or PIN code in the search bar above to discover hospitals and blood banks.
          </p>
        </div>
      ) : facilities.length === 0 ? (
        <div className="bg-white p-10 text-center rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <Building2 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Facilities Found within {radiusKm} km</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No hospitals or blood banks were found within {radiusKm} km of "{activeLocation.query}". Try expanding the search radius to 25 km or 50 km.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            {[25, 50].map((r) => (
              <button
                key={r}
                onClick={() => handleRadiusChange(r)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg transition-colors"
              >
                Expand to {r} km
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {facilities.map((facility) => {
            const isBloodBank = facility.type === 'Blood Bank';
            const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}`;

            return (
              <div
                key={facility.id}
                className={`bg-white rounded-2xl border p-4 shadow-2xs hover:shadow-sm transition-all duration-150 flex flex-col justify-between space-y-3 ${
                  facility.isPartner
                    ? 'border-purple-200 bg-purple-50/10 hover:border-purple-300'
                    : isBloodBank
                    ? 'border-red-200 hover:border-red-300'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Header: Name, Type, Distance */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start space-x-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 mt-0.5 ${
                          facility.isPartner
                            ? 'bg-purple-100 text-purple-700'
                            : isBloodBank
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {isBloodBank ? <Navigation className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug">
                            {facility.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span
                            className={`px-1.5 py-0.2 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                              isBloodBank
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {facility.type}
                          </span>

                          {facility.isPartner && (
                            <span className="px-1.5 py-0.2 rounded-md text-[9px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 flex items-center space-x-1">
                              <ShieldCheck className="w-2.5 h-2.5" />
                              <span>Campus Partner</span>
                            </span>
                          )}

                          <span className="text-[10px] text-slate-400 font-medium">
                            • {facility.source}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                      {facility.distance} km away
                    </span>
                  </div>

                  {/* Address */}
                  <div className="text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100 space-y-1">
                    <p className="flex items-start space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="text-[11px] leading-relaxed text-slate-700">{facility.address}</span>
                    </p>

                    {/* Phone Number (Strictly Genuine) */}
                    <div className="flex items-center space-x-1.5 text-[11px]">
                      <Phone className="w-3.5 h-3.5 text-blood-600 shrink-0" />
                      <span>
                        Phone:{' '}
                        {facility.phone ? (
                          <a
                            href={`tel:${facility.phone}`}
                            className="font-bold text-blood-600 hover:underline"
                          >
                            {facility.phone}
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">Not available</span>
                        )}
                      </span>
                    </div>

                    {/* Opening Hours (If Genuine) */}
                    {facility.openingHours && (
                      <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Hours: {facility.openingHours}</span>
                      </div>
                    )}

                    {/* Website (If Genuine) */}
                    {facility.website && (
                      <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
                        <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <a
                          href={facility.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline truncate"
                        >
                          {facility.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions: Directions & View on Map */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleFocusOnMap(facility)}
                    className="px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center space-x-1"
                  >
                    <MapIcon className="w-3 h-3 text-slate-500" />
                    <span>View on Map</span>
                  </button>

                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs shadow-2xs transition-all flex items-center space-x-1 hover:shadow-xs active:scale-95"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Directions</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
