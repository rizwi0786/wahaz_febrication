import { Link } from 'react-router-dom';
import { Sparkles, Phone, CalendarCheck, MapPin, Mail, MessageCircle, ArrowRight } from 'lucide-react';
import {
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_TEL,
  CONTACT_WHATSAPP,
  WHATSAPP_DEFAULT_MSG,
} from '../config/contact';

const SERVICES = [
  {
    key: 'custom',
    icon: Sparkles,
    title: 'Custom Design Order',
    desc: 'Upload your design and measurements. Our team will quote a price, you can counter once, and we craft it to perfection.',
    cta: 'Submit a design',
    to: '/custom-orders/new',
  },
  {
    key: 'session',
    icon: CalendarCheck,
    title: 'Schedule a Session',
    desc: 'Book a virtual consultation with our designers via Google Meet. Pick a date and time that works for you.',
    cta: 'Book a session',
    to: '/services/schedule',
  },
  {
    key: 'studio',
    icon: MapPin,
    title: 'Visit Our Studio',
    desc: 'Drop by our studio to feel the fabric and try on pieces. Get directions to us from your location.',
    cta: 'Get directions',
    to: '/services/studio',
  },
];

export default function Services() {
  const whatsappHref = `https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent(WHATSAPP_DEFAULT_MSG)}`;
  return (
    <div className="section py-10 max-w-6xl">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-serif mb-3">Our Services</h1>
        <p className="text-brand-muted max-w-2xl mx-auto">
          From bespoke designs to in-person fittings — choose how you'd like to experience Bellissimo Couture.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        {SERVICES.map(({ key, icon: Icon, title, desc, cta, to }) => (
          <Link
            key={key}
            to={to}
            className="card p-6 group hover:shadow-xl transition flex flex-col"
          >
            <div className="w-12 h-12 rounded-full bg-brand-secondary/10 text-brand-secondary flex items-center justify-center mb-4">
              <Icon size={22} />
            </div>
            <h2 className="font-serif text-xl mb-2">{title}</h2>
            <p className="text-sm text-brand-muted leading-relaxed flex-1 mb-4">{desc}</p>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-secondary group-hover:gap-2 transition-all">
              {cta} <ArrowRight size={14} />
            </span>
          </Link>
        ))}
      </div>

      {/* Connect with us */}
      <div className="card p-6 md:p-8 bg-brand-primary text-white">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-center">
          <div>
            <div className="w-12 h-12 rounded-full bg-brand-secondary/20 text-brand-secondary flex items-center justify-center mb-3">
              <Phone size={22} />
            </div>
            <h2 className="font-serif text-2xl mb-2">Connect With Us</h2>
            <p className="text-sm text-white/70 mb-4 max-w-2xl">
              Have a question? Reach out via email, phone, or WhatsApp — we usually respond within a few hours.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-md text-sm transition"
              >
                <Mail size={16} /> {CONTACT_EMAIL}
              </a>
              <a
                href={`tel:${CONTACT_PHONE_TEL}`}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-md text-sm transition"
              >
                <Phone size={16} /> {CONTACT_PHONE_DISPLAY}
              </a>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1faa54] px-4 py-2 rounded-md text-sm transition"
              >
                <MessageCircle size={16} /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
