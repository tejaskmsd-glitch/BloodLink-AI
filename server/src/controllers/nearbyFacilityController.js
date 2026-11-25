const Hospital = require('../models/Hospital');

// In-memory cache with TTL (1 hour)
const geocodeCache = new Map();
const nearbyCache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000;

// Curated high-accuracy coordinates for common Indian colleges, campuses, and cities
// Provides instantaneous resolution and reliable offline/sandbox fallback
const KNOWN_INDIAN_LOCATIONS = [
  {
    keywords: ['jc bose', 'ymca', 'jc bose university'],
    displayName: 'J.C. Bose University of Science and Technology, YMCA, Sector 6, Faridabad, Haryana 121006',
    latitude: 28.3676,
    longitude: 77.3159
  },
  {
    keywords: ['delhi university', 'du north campus', 'north campus', 'delhi university north campus'],
    displayName: 'University of Delhi, North Campus, University Enclave, Delhi 110007',
    latitude: 28.6911,
    longitude: 77.2141
  },
  {
    keywords: ['delhi university south campus', 'du south campus', 'south campus'],
    displayName: 'University of Delhi, South Campus, Benito Juarez Marg, Dhaula Kuan, New Delhi 110021',
    latitude: 28.5855,
    longitude: 77.1643
  },
  {
    keywords: ['iit delhi', 'indian institute of technology delhi'],
    displayName: 'IIT Delhi, Hauz Khas, New Delhi, Delhi 110016',
    latitude: 28.5450,
    longitude: 77.1926
  },
  {
    keywords: ['jnu', 'jawaharlal nehru university'],
    displayName: 'Jawaharlal Nehru University, New Mehrauli Road, New Delhi 110067',
    latitude: 28.5385,
    longitude: 77.1668
  },
  {
    keywords: ['nit kurukshetra'],
    displayName: 'National Institute of Technology Kurukshetra, Thanesar, Haryana 136119',
    latitude: 29.9482,
    longitude: 76.8173
  },
  {
    keywords: ['nitk', 'nit surathkal'],
    displayName: 'National Institute of Technology Karnataka, Surathkal, Mangalore 575025',
    latitude: 13.0108,
    longitude: 74.7925
  },
  {
    keywords: ['faridabad', '121001', '121002', '121003', '121004', '121005', '121006'],
    displayName: 'Faridabad, National Capital Region (NCR), Haryana, India',
    latitude: 28.4089,
    longitude: 77.3178
  },
  {
    keywords: ['gurugram', 'gurgaon', '122001', '122002'],
    displayName: 'Gurugram, National Capital Region (NCR), Haryana, India',
    latitude: 28.4595,
    longitude: 77.0266
  },
  {
    keywords: ['noida', '201301', '201307', '201309'],
    displayName: 'Noida, Gautam Buddha Nagar, Uttar Pradesh, India',
    latitude: 28.5355,
    longitude: 77.3910
  },
  {
    keywords: ['delhi', 'new delhi', '110001', '110007', '110016'],
    displayName: 'New Delhi, National Capital Territory, India',
    latitude: 28.6139,
    longitude: 77.2090
  },
  {
    keywords: ['jaipur', '302001', '302004'],
    displayName: 'Jaipur, Rajasthan, India',
    latitude: 26.9124,
    longitude: 75.7873
  },
  {
    keywords: ['chandigarh', '160014', '160017', '160022'],
    displayName: 'Chandigarh, Union Territory, India',
    latitude: 30.7333,
    longitude: 76.7794
  },
  {
    keywords: ['lucknow', '226001', '226007'],
    displayName: 'Lucknow, Uttar Pradesh, India',
    latitude: 26.8467,
    longitude: 80.9462
  }
];

// Exact Haversine formula calculation in kilometers
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

// @desc    Get configured default campus location
// @route   GET /api/nearby-facilities/default-campus
// @access  Public
const getDefaultCampus = async (req, res) => {
  const name = process.env.CAMPUS_NAME || '';
  const address = process.env.CAMPUS_ADDRESS || '';
  const lat = process.env.CAMPUS_LATITUDE ? parseFloat(process.env.CAMPUS_LATITUDE) : null;
  const lon = process.env.CAMPUS_LONGITUDE ? parseFloat(process.env.CAMPUS_LONGITUDE) : null;

  const isConfigured = Boolean(name && lat != null && lon != null);

  res.json({
    success: true,
    configured: isConfigured,
    campus: isConfigured
      ? {
          name,
          address,
          latitude: lat,
          longitude: lon
        }
      : null
  });
};

// @desc    Geocode a college name, address, city or PIN code
// @route   GET /api/nearby-facilities/geocode
// @access  Public
const geocodeLocation = async (req, res) => {
  try {
    const rawQuery = (req.query.query || '').trim();
    if (!rawQuery) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a location, college name, city, or PIN code to search.'
      });
    }

    const cacheKey = rawQuery.toLowerCase();
    const cached = geocodeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return res.json({ success: true, location: cached.data });
    }

    // 1. Check known Indian colleges and cities dictionary for instant, accurate matching
    const normalized = rawQuery.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    const match = KNOWN_INDIAN_LOCATIONS.find(item =>
      item.keywords.some(kw => normalized.includes(kw) || kw.includes(normalized))
    );

    if (match) {
      const resultData = {
        query: rawQuery,
        displayName: match.displayName,
        latitude: match.latitude,
        longitude: match.longitude,
        source: 'campus-directory'
      };
      geocodeCache.set(cacheKey, { timestamp: Date.now(), data: resultData });
      return res.json({ success: true, location: resultData });
    }

    // 2. Query OpenStreetMap Nominatim with Indian country constraint
    const isPostalCode = /^\d{6}$/.test(rawQuery.trim());
    const searchQuery = isPostalCode ? `${rawQuery.trim()}, India` : rawQuery;
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&q=${encodeURIComponent(
      searchQuery
    )}&limit=1&addressdetails=1`;

    let nominatimResult = null;
    try {
      const response = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'BloodLink-AI-SmartCampus/1.0 (bloodlink-campus@bloodlink.ai)',
          Accept: 'application/json'
        },
        signal: AbortSignal.timeout(5000)
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          nominatimResult = data[0];
        }
      }
    } catch (fetchErr) {
      console.warn('Nominatim geocode network fetch timed out or failed:', fetchErr.message);
    }

    if (nominatimResult) {
      const resultData = {
        query: rawQuery,
        displayName: nominatimResult.display_name,
        latitude: parseFloat(nominatimResult.lat),
        longitude: parseFloat(nominatimResult.lon),
        source: 'openstreetmap-nominatim'
      };
      geocodeCache.set(cacheKey, { timestamp: Date.now(), data: resultData });
      return res.json({ success: true, location: resultData });
    }

    // 3. Fallback: If Nominatim couldn't find with countrycodes=in, try global Nominatim query
    try {
      const globalUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        rawQuery
      )}&limit=1&addressdetails=1`;
      const globalRes = await fetch(globalUrl, {
        headers: {
          'User-Agent': 'BloodLink-AI-SmartCampus/1.0 (bloodlink-campus@bloodlink.ai)'
        },
        signal: AbortSignal.timeout(4000)
      });
      if (globalRes.ok) {
        const globalData = await globalRes.json();
        if (Array.isArray(globalData) && globalData.length > 0) {
          const loc = globalData[0];
          const resultData = {
            query: rawQuery,
            displayName: loc.display_name,
            latitude: parseFloat(loc.lat),
            longitude: parseFloat(loc.lon),
            source: 'openstreetmap-global'
          };
          geocodeCache.set(cacheKey, { timestamp: Date.now(), data: resultData });
          return res.json({ success: true, location: resultData });
        }
      }
    } catch (globalErr) {
      console.warn('Global Nominatim search error:', globalErr.message);
    }

    return res.status(404).json({
      success: false,
      message: `Could not pinpoint "${rawQuery}". Please check the spelling or search by campus city (e.g. Faridabad, Delhi) or 6-digit PIN code.`
    });
  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to geocode location due to server error. Please try again.'
    });
  }
};

// Helper: Format OSM Nominatim result into standard facility object
const formatFacilityFromOSM = (item, centerLat, centerLon) => {
  const lat = parseFloat(item.lat);
  const lon = parseFloat(item.lon);
  const dist = calculateDistanceKm(centerLat, centerLon, lat, lon);

  const extratags = item.extratags || {};
  const addr = item.address || {};

  // Construct clean, compact address
  const streetParts = [
    addr.house_number,
    addr.road || addr.street,
    addr.suburb || addr.neighbourhood,
    addr.city || addr.town || addr.county,
    addr.state,
    addr.postcode
  ].filter(Boolean);

  const fullAddress = streetParts.length > 0 ? streetParts.join(', ') : item.display_name;

  // Detect facility type
  const isBloodBank =
    item.type === 'blood_bank' ||
    extratags.healthcare === 'blood_bank' ||
    (item.name && /blood\s*bank|blood\s*centre|transfusion/i.test(item.name));

  const isClinic = item.type === 'clinic' || extratags.healthcare === 'clinic';
  const facilityType = isBloodBank ? 'Blood Bank' : (isClinic ? 'Clinic' : 'Hospital');

  // Phone: strictly only if provided by the data provider
  const phone = extratags.phone || extratags['contact:phone'] || addr.phone || null;

  // Website: strictly only if provided
  const website = extratags.website || extratags['contact:website'] || null;

  // Opening hours: strictly only if provided
  const openingHours = extratags.opening_hours || null;

  return {
    id: `osm-${item.osm_type || 'node'}-${item.osm_id || item.place_id}`,
    name: item.name || (item.namedetails && item.namedetails.name) || 'Healthcare Facility',
    type: facilityType,
    address: fullAddress,
    distance: dist,
    latitude: lat,
    longitude: lon,
    phone,
    website,
    openingHours,
    isPartner: false,
    source: 'OpenStreetMap'
  };
};

// @desc    Search nearby hospitals and blood banks around coordinates
// @route   GET /api/nearby-facilities/search
// @access  Public
const searchNearbyFacilities = async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    const radius = Math.min(Math.max(parseFloat(req.query.radius) || 10, 1), 100); // 1-100 km, default 10
    const filterType = (req.query.type || 'all').toLowerCase(); // 'all', 'hospitals', 'blood_banks'

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({
        success: false,
        message: 'Valid latitude and longitude coordinates are required.'
      });
    }

    const cacheKey = `${lat.toFixed(3)}_${lon.toFixed(3)}_${radius}_${filterType}`;
    const cached = nearbyCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return res.json({
        success: true,
        searchLocation: { latitude: lat, longitude: lon, radiusKm: radius },
        total: cached.data.length,
        facilities: cached.data
      });
    }

    const facilitiesMap = new Map();

    // 1. Fetch Registered Partner Hospitals from Database
    try {
      const dbHospitals = await Hospital.find({});
      for (const h of dbHospitals) {
        if (h.location?.latitude && h.location?.longitude) {
          const d = calculateDistanceKm(lat, lon, h.location.latitude, h.location.longitude);
          if (d <= radius) {
            const isBloodBank = /blood\s*bank|blood\s*centre/i.test(h.hospitalName);
            const facilityType = isBloodBank ? 'Blood Bank' : 'Hospital';

            facilitiesMap.set(`db-${h._id}`, {
              id: `db-${h._id}`,
              name: h.hospitalName,
              type: facilityType,
              address: [h.address?.street, h.city, h.address?.state, h.address?.zipCode].filter(Boolean).join(', ') || h.city,
              distance: d,
              latitude: h.location.latitude,
              longitude: h.location.longitude,
              phone: h.emergencyContact || h.phone || null,
              website: null,
              openingHours: '24/7 Emergency Care',
              isPartner: true,
              registrationNumber: h.registrationNumber,
              contactPerson: h.contactPerson,
              source: 'Registered Campus Partner'
            });
          }
        }
      }
    } catch (dbErr) {
      console.warn('Could not query DB partner hospitals:', dbErr.message);
    }

    // 2. Query OpenStreetMap Nominatim with viewbox bounded search
    // ~111km per degree latitude. Add 15% safety buffer to bounding box
    const delta = (radius / 111) * 1.15;
    const viewbox = `${lon - delta},${lat + delta},${lon + delta},${lat - delta}`;

    const queries = [];
    if (filterType === 'all' || filterType === 'hospitals') {
      queries.push('hospital');
    }
    if (filterType === 'all' || filterType === 'blood_banks') {
      queries.push('blood+bank');
    }

    for (const q of queries) {
      const osmUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${q}&viewbox=${viewbox}&bounded=1&limit=25&addressdetails=1&extratags=1`;
      try {
        const osmRes = await fetch(osmUrl, {
          headers: {
            'User-Agent': 'BloodLink-AI-SmartCampus/1.0 (bloodlink-campus@bloodlink.ai)',
            Accept: 'application/json'
          },
          signal: AbortSignal.timeout(6000)
        });

        if (osmRes.ok) {
          const items = await osmRes.json();
          if (Array.isArray(items)) {
            for (const item of items) {
              const formatted = formatFacilityFromOSM(item, lat, lon);
              if (formatted.distance <= radius) {
                facilitiesMap.set(formatted.id, formatted);
              }
            }
          }
        }
      } catch (osmErr) {
        console.warn(`OSM Nominatim fetch for ${q} failed or timed out:`, osmErr.message);
      }
    }

    // 3. Convert map to list and filter by requested facility type
    let facilityList = Array.from(facilitiesMap.values());

    if (filterType === 'blood_banks') {
      facilityList = facilityList.filter(f => f.type === 'Blood Bank');
    } else if (filterType === 'hospitals') {
      facilityList = facilityList.filter(f => f.type === 'Hospital' || f.type === 'Clinic');
    }

    // 4. Sort results strictly by distance, nearest first
    facilityList.sort((a, b) => a.distance - b.distance);

    // Cache the result
    nearbyCache.set(cacheKey, { timestamp: Date.now(), data: facilityList });

    res.json({
      success: true,
      searchLocation: { latitude: lat, longitude: lon, radiusKm: radius },
      total: facilityList.length,
      facilities: facilityList
    });
  } catch (error) {
    console.error('Nearby facility discovery error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search nearby facilities. Please try again.'
    });
  }
};

module.exports = {
  getDefaultCampus,
  geocodeLocation,
  searchNearbyFacilities,
  calculateDistanceKm
};
