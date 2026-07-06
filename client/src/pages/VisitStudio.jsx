import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MapPin, Navigation, Phone, ArrowLeft, ExternalLink } from 'lucide-react';
import Button from '../components/common/Button';
import {
  STUDIO,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_TEL,
  mapsDirectionsUrl,
  mapsEmbedUrl,
} from '../config/contact';

export default function VisitStudio() {
  const [locating, setLocating] = useState(false);

  const openDirections = (origin) => {
    window.open(mapsDirectionsUrl(origin || {}), '_blank', 'noopener,noreferrer');
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported in this browser');
      openDirections();
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        openDirections({ originLat: pos.coords.latitude, originLng: pos.coords.longitude });
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) {
          toast.error('Location permission denied — opening directions without origin');
        } else {
          toast.error('Could not get your location — opening directions without origin');
        }
        openDirections();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  return (
    <div className="section py-8 max-w-5xl">
      <Link to="/services" className="inline-flex items-center text-sm text-brand-muted hover:text-brand-primary mb-4">
        <ArrowLeft size={14} className="mr-1" /> Back to services
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-brand-secondary/10 text-brand-secondary flex items-center justify-center">
          <MapPin size={20} />
        </div>
        <h1 className="text-2xl md:text-3xl font-serif">Visit Our Studio</h1>
      </div>
      <p className="text-sm text-brand-muted mb-6">
        Stop by to feel the fabrics, see the craftsmanship, and try on pieces.
      </p>

      <div className="grid md:grid-cols-[1fr_320px] gap-6">
        <div className="card overflow-hidden">
          <iframe
            title="Studio location"
            src={mapsEmbedUrl()}
            width="100%"
            height="420"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <div className="card p-5 h-fit">
          <h2 className="font-serif text-xl mb-2">{STUDIO.name}</h2>
          <p className="text-sm text-brand-muted mb-4 flex items-start gap-2">
            <MapPin size={16} className="shrink-0 mt-0.5" />
            <span>{STUDIO.address}</span>
          </p>
          <p className="text-sm text-brand-muted mb-5 flex items-center gap-2">
            <Phone size={16} className="shrink-0" />
            <a href={`tel:${CONTACT_PHONE_TEL}`} className="hover:text-brand-primary">
              {CONTACT_PHONE_DISPLAY}
            </a>
          </p>

          <Button onClick={useMyLocation} loading={locating} className="w-full mb-2">
            <Navigation size={16} /> Get directions from my location
          </Button>
          <a
            href={STUDIO.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 text-sm text-brand-secondary hover:underline py-2"
          >
            <ExternalLink size={14} /> Open in Google Maps
          </a>

          <p className="text-xs text-brand-muted mt-4">
            We'll ask for your browser's location so Google Maps can plot the best route.
          </p>
        </div>
      </div>
    </div>
  );
}
