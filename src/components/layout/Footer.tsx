import { Link } from 'react-router-dom';
import { Coffee, MapPin, Phone, Clock, Instagram, Facebook } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-primary-foreground rounded-full flex items-center justify-center">
                <Coffee className="w-5 h-5 text-primary" />
              </div>
              <span className="font-serif text-2xl font-semibold">
                Bistro@17
              </span>
            </Link>
            <p className="text-primary-foreground/80 max-w-sm mb-4">
              Your cozy corner in Kurukshetra. Good coffee, better vibes, 
              and a peaceful escape from the everyday.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-10 h-10 bg-primary-foreground/10 hover:bg-primary-foreground/20 rounded-full flex items-center justify-center transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-primary-foreground/10 hover:bg-primary-foreground/20 rounded-full flex items-center justify-center transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
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
                <Link to="/about" className="hover:text-primary-foreground transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Staff Links */}
          <div>
            <h4 className="font-semibold mb-4">Staff</h4>
            <ul className="space-y-2 text-primary-foreground/80">
              <li>
                <Link to="/auth" className="hover:text-primary-foreground transition-colors">
                  Staff Login
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-primary-foreground transition-colors">
                  Admin Panel
                </Link>
              </li>
              <li>
                <Link to="/kitchen" className="hover:text-primary-foreground transition-colors">
                  Kitchen Display
                </Link>
              </li>
              <li>
                <Link to="/qr-codes" className="hover:text-primary-foreground transition-colors">
                  Table QR Codes
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Visit Us</h4>
            <ul className="space-y-3 text-primary-foreground/80">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                <span>Sector 17, Kurukshetra, Haryana</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>10 AM - 10 PM</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-primary-foreground/20 text-center text-sm text-primary-foreground/60">
          <p>© 2024 Bistro@17. All rights reserved. Made with ☕ in Kurukshetra.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
