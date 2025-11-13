/**
 * Geographic utility functions for distance calculations and location-based operations
 * Used for finding nearby donors and calculating distances between hospitals and donors
 */

/**
 * Calculate the distance between two coordinates using the Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
}

/**
 * Convert degrees to radians
 * @param {number} deg - Degrees
 * @returns {number} Radians
 */
function deg2rad(deg) {
  return deg * (Math.PI/180);
}

/**
 * Find donors within a specified radius of a location
 * @param {Array} donors - Array of donor objects with lat/lng coordinates
 * @param {number} centerLat - Center latitude
 * @param {number} centerLng - Center longitude
 * @param {number} radiusKm - Radius in kilometers
 * @returns {Array} Array of donors within radius with distance calculated
 */
export function findDonorsWithinRadius(donors, centerLat, centerLng, radiusKm) {
  if (!donors || !Array.isArray(donors)) {
    return [];
  }

  return donors
    .filter(donor => {
      // Check if donor has valid coordinates
      if (!donor.latitude || !donor.longitude) {
        return false;
      }

      // Calculate distance
      const distance = calculateDistance(
        centerLat, centerLng,
        donor.latitude, donor.longitude
      );

      // Add distance to donor object
      donor.distance = Math.round(distance * 10) / 10; // Round to 1 decimal place

      // Check if within radius
      return distance <= radiusKm;
    })
    .sort((a, b) => a.distance - b.distance); // Sort by distance (closest first)
}

/**
 * Get bounding box coordinates for a given center point and radius
 * This is useful for database queries to limit the search area
 * @param {number} lat - Center latitude
 * @param {number} lng - Center longitude
 * @param {number} radiusKm - Radius in kilometers
 * @returns {Object} Bounding box with min/max lat/lng
 */
export function getBoundingBox(lat, lng, radiusKm) {
  const R = 6371; // Earth's radius in kilometers
  
  // Convert radius to degrees (approximate)
  const latDelta = radiusKm / R * (180 / Math.PI);
  const lngDelta = radiusKm / (R * Math.cos(lat * Math.PI / 180)) * (180 / Math.PI);
  
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta
  };
}

/**
 * Format distance for display
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string} Formatted distance string
 */
export function formatDistance(distanceKm) {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  } else if (distanceKm < 10) {
    return `${Math.round(distanceKm * 10) / 10}km`;
  } else {
    return `${Math.round(distanceKm)}km`;
  }
}

/**
 * Check if a donor is eligible based on various criteria
 * @param {Object} donor - Donor object
 * @param {string} requiredBloodType - Required blood type
 * @param {number} maxDistance - Maximum distance in kilometers
 * @param {number} centerLat - Center latitude
 * @param {number} centerLng - Center longitude
 * @returns {Object} Eligibility result with reasons
 */
export function checkDonorEligibility(donor, requiredBloodType, maxDistance, centerLat, centerLng) {
  const result = {
    eligible: true,
    reasons: []
  };

  // Check blood type compatibility
  if (!isBloodTypeCompatible(donor.blood_type, requiredBloodType)) {
    result.eligible = false;
    result.reasons.push('Blood type not compatible');
  }

  // Check availability
  if (!donor.is_available) {
    result.eligible = false;
    result.reasons.push('Donor not available');
  }

  // Check distance
  if (donor.latitude && donor.longitude) {
    const distance = calculateDistance(centerLat, centerLng, donor.latitude, donor.longitude);
    if (distance > maxDistance) {
      result.eligible = false;
      result.reasons.push(`Too far (${formatDistance(distance)})`);
    }
    donor.distance = distance;
  }

  // Check last donation date (if available)
  if (donor.last_donation_date) {
    const lastDonation = new Date(donor.last_donation_date);
    const daysSinceDonation = (new Date() - lastDonation) / (1000 * 60 * 60 * 24);
    if (daysSinceDonation < 56) { // 56 days is the standard waiting period
      result.eligible = false;
      result.reasons.push(`Recent donation (${Math.round(daysSinceDonation)} days ago)`);
    }
  }

  return result;
}

/**
 * Check if two blood types are compatible
 * @param {string} donorBloodType - Donor's blood type
 * @param {string} requiredBloodType - Required blood type
 * @returns {boolean} True if compatible
 */
export function isBloodTypeCompatible(donorBloodType, requiredBloodType) {
  if (!donorBloodType || !requiredBloodType) {
    return false;
  }

  // Blood type compatibility matrix
  const compatibility = {
    'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'], // Universal donor
    'O+': ['O+', 'A+', 'B+', 'AB+'],
    'A-': ['A-', 'A+', 'AB-', 'AB+'],
    'A+': ['A+', 'AB+'],
    'B-': ['B-', 'B+', 'AB-', 'AB+'],
    'B+': ['B+', 'AB+'],
    'AB-': ['AB-', 'AB+'],
    'AB+': ['AB+'] // Universal recipient
  };

  return compatibility[donorBloodType]?.includes(requiredBloodType) || false;
}

/**
 * Get estimated travel time based on distance
 * @param {number} distanceKm - Distance in kilometers
 * @param {string} transportMode - 'driving', 'walking', 'cycling'
 * @returns {Object} Estimated time in minutes and formatted string
 */
export function getEstimatedTravelTime(distanceKm, transportMode = 'driving') {
  const speeds = {
    driving: 30, // km/h average in city
    walking: 5,  // km/h
    cycling: 15  // km/h
  };

  const speed = speeds[transportMode] || speeds.driving;
  const timeHours = distanceKm / speed;
  const timeMinutes = Math.round(timeHours * 60);

  return {
    minutes: timeMinutes,
    formatted: timeMinutes < 60 
      ? `${timeMinutes} min`
      : `${Math.floor(timeMinutes / 60)}h ${timeMinutes % 60}m`
  };
}

/**
 * Validate coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} True if valid coordinates
 */
export function isValidCoordinates(lat, lng) {
  return (
    typeof lat === 'number' && 
    typeof lng === 'number' &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180 &&
    !isNaN(lat) && !isNaN(lng)
  );
}

/**
 * Get user's current location using browser geolocation API
 * @returns {Promise<Object>} Promise resolving to {lat, lng} or null
 */
export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
}

