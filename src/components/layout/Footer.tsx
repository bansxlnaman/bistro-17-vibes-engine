import { Link } from 'react-router-dom';
import { Coffee, MapPin, Phone, Clock, Instagram, Facebook } from 'lucide-react';
import { useCafe } from '@/context/CafeContext';

const Footer = () => {
  const { cafe, loading } = useCafe();

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              {cafe?.logo_url ? (
                <img 
                  src={cafe.logo_url} 
                  alt={cafe?.name || 'Café'}
                  className="w-10 h-10 rounded-full object-cover bg-primary-foreground"
                />
              ) : (
                <div className="w-10 h-10 bg-primary-foreground rounded-full flex items-center justify-center">
                  <Coffee className="w-5 h-5 text-primary" />
                </div>
              )}
              <span className="font-serif text-2xl font-semibold">
                {loading ? '...' : cafe?.name || 'Café'}
              </span>
            </Link>
            <p className="text-primary-foreground/80 max-w-sm mb-4">
              {cafe?.description || 'Welcome to our café. Good coffee, great vibes.'}
            </p>
            <div className="flex gap-3">
              {cafe?.instagram_url && (
                <a
                  href={cafe.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-primary-foreground/10 hover:bg-primary-foreground/20 rounded-full flex items-center justify-center transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {cafe?.facebook_url && (
                <a
                  href={cafe.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-primary-foreground/10 hover:bg-primary-foreground/20 rounded-full flex items-center justify-center transition-colors"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-primary-foreground/80">
              <li>
                <Link to="/" className="hover:text-primary-foreground transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/menu" className="hover:text-primary-foreground transition-colors">
                  Menu
                </Link>
              </li>
              <li>
                <Link to="/order" className="hover:text-primary-foreground transition-colors">
                  Order Now
                </Link>
              </li>
              <li>
                <Link to="/track-order" className="hover:text-primary-foreground transition-colors">
                  Track Order
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-primary-foreground transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Visit Us</h4>
            <ul className="space-y-3 text-primary-foreground/80">
              {cafe?.address && (
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                  <span>{cafe.address}</span>
                </li>
              )}
              {cafe?.phone && (
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <a href={`tel:${cafe.phone}`} className="hover:text-primary-foreground">
                    {cafe.phone}
                  </a>
                </li>
              )}
              {cafe?.opening_hours && (
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>{cafe.opening_hours}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-primary-foreground/20 text-center text-sm text-primary-foreground/60">
          <p>© {new Date().getFullYear()} {cafe?.name || 'Café'}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
