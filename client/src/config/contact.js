// Single source of truth for contact + studio info shown across the site.
// Update these constants when the brand details change.

export const CONTACT_EMAIL = 'bellisssimocouture@gmail.com';
export const CONTACT_PHONE_DISPLAY = '+91 72177 88633';
export const CONTACT_PHONE_TEL = '+917217788633';
export const CONTACT_WHATSAPP = '917217788633';
export const WHATSAPP_DEFAULT_MSG = "Hi Bellissimo Couture, I'd like to know more about your services.";

// Social
export const INSTAGRAM_HANDLE = 'bellissimo_couture';
export const INSTAGRAM_URL = 'https://www.instagram.com/bellissimo_couture';

// Studio location — used by the "Visit our studio" page.
// Coordinates from the studio's Google Maps listing (Bellissimo Couture, Punjabi Bagh).
export const STUDIO = {
  name: 'Bellissimo Couture Studio',
  address: 'Punjabi Bagh, New Delhi, Delhi 110034',
  lat: 28.6835098,
  lng: 77.1411708,
};

export const mapsDirectionsUrl = ({ originLat, originLng } = {}) => {
  const dest = `${STUDIO.lat},${STUDIO.lng}`;
  if (originLat != null && originLng != null) {
    return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${dest}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
};

export const mapsEmbedUrl = () =>
  `https://www.google.com/maps?q=${STUDIO.lat},${STUDIO.lng}&z=15&output=embed`;
