import { Link } from 'react-router-dom';
import { Instagram, Mail, Phone, MapPin, MessageCircle } from 'lucide-react';
import {
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_TEL,
  CONTACT_WHATSAPP,
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
} from '../../config/contact';

export default function Footer() {
  return (
    <footer className="bg-brand-primary text-white mt-20">
      <div className="section py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <img src="/logo.png" alt="Bellissimo Couture" className="h-14 w-auto mb-4 brightness-200" />
          <p className="text-sm text-white/70 leading-relaxed">
            Designer Attire. Timeless Impression. Blending Italian finesse with royal heritage.
          </p>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            aria-label={`Follow @${INSTAGRAM_HANDLE} on Instagram`}
            className="inline-flex items-center gap-2 mt-4 text-sm text-white/70 hover:text-brand-secondary"
          >
            <Instagram size={18} /> @{INSTAGRAM_HANDLE}
          </a>
        </div>

        <div>
          <h4 className="font-medium mb-4 text-brand-secondary">Shop</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link to="/shop?category=suits" className="hover:text-white">Suits</Link></li>
            <li><Link to="/shop?category=blazers" className="hover:text-white">Blazers</Link></li>
            <li><Link to="/shop?category=sherwani" className="hover:text-white">Sherwani</Link></li>
            <li><Link to="/shop?category=designer-coats" className="hover:text-white">Designer Coats</Link></li>
            <li><Link to="/shop" className="hover:text-white">All Products</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-medium mb-4 text-brand-secondary">Company</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link to="/services" className="hover:text-white">Our Services</Link></li>
            <li><Link to="/services/schedule" className="hover:text-white">Schedule a session</Link></li>
            <li><Link to="/services/studio" className="hover:text-white">Visit our studio</Link></li>
            <li><Link to="/custom-orders/new" className="hover:text-white">Custom Design</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-medium mb-4 text-brand-secondary">Contact</h4>
          <ul className="space-y-3 text-sm text-white/70">
            <li className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0" /> New Delhi, India
            </li>
            <li className="flex items-center gap-2">
              <Phone size={16} />
              <a href={`tel:${CONTACT_PHONE_TEL}`} className="hover:text-white">{CONTACT_PHONE_DISPLAY}</a>
            </li>
            <li className="flex items-center gap-2">
              <MessageCircle size={16} />
              <a
                href={`https://wa.me/${CONTACT_WHATSAPP}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white"
              >
                WhatsApp
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail size={16} />
              <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-white break-all">{CONTACT_EMAIL}</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-5">
        <div className="section flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/50">
          <p>© {new Date().getFullYear()} Bellissimo Couture. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/privacy-policy" className="hover:text-white">Privacy Policy</Link>
            <Link to="/terms-of-service" className="hover:text-white">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
