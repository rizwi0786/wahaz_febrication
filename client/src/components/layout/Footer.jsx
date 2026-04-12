import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-brand-primary text-white mt-20">
      <div className="section py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <h3 className="font-serif text-2xl mb-4">
            Wahaz <span className="text-brand-secondary">Fabrication</span>
          </h3>
          <p className="text-sm text-white/70 leading-relaxed">
            Premium designer menswear crafted for the modern gentleman. Tailored fits, refined fabrics.
          </p>
          <div className="flex gap-3 mt-4">
            <a href="#" className="hover:text-brand-secondary"><Facebook size={18} /></a>
            <a href="#" className="hover:text-brand-secondary"><Instagram size={18} /></a>
            <a href="#" className="hover:text-brand-secondary"><Twitter size={18} /></a>
          </div>
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
            <li>About us</li>
            <li>Contact</li>
            <li>Shipping & Returns</li>
            <li>Size Guide</li>
            <li>FAQ</li>
          </ul>
        </div>

        <div>
          <h4 className="font-medium mb-4 text-brand-secondary">Contact</h4>
          <ul className="space-y-3 text-sm text-white/70">
            <li className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0" /> New Delhi, India
            </li>
            <li className="flex items-center gap-2">
              <Phone size={16} /> +91 98765 43210
            </li>
            <li className="flex items-center gap-2">
              <Mail size={16} /> hello@wahazfabrication.com
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-5">
        <div className="section flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/50">
          <p>© {new Date().getFullYear()} Wahaz Fabrication. All rights reserved.</p>
          <div className="flex gap-4">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
