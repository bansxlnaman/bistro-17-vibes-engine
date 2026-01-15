import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Star, Leaf, Music, BookOpen, Coffee } from 'lucide-react';
import { useCafe } from '@/context/CafeContext';
import heroImage from '@/assets/hero-cafe.jpg';

const HeroSection = () => {
  const { cafe, loading } = useCafe();

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt={cafe?.name ? `${cafe.name} café interior` : 'Café interior'}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 pt-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-fade-up">
            {/* Rating Badge */}
            <div className="inline-flex items-center gap-2 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-full border border-border/50">
              <div className="flex items-center gap-1 text-accent">
                <Star className="w-4 h-4 fill-current" />
                <span className="font-semibold">4.7</span>
              </div>
              <span className="text-sm text-muted-foreground">500+ Reviews</span>
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground leading-tight">
                {cafe?.tagline || (
                  <>
                    Your Own
                    <br />
                    <span className="text-primary">Cozy Corner</span>
                  </>
                )}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-md font-sans">
                {cafe?.description || 'Where good coffee meets better vibes. Your perfect escape.'}
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <Link to="/order">
                <Button variant="hero" size="lg">
                  <Coffee className="w-5 h-5 mr-2" />
                  Order From Table
                </Button>
              </Link>
              <Link to="/menu">
                <Button variant="heroSecondary" size="lg">
                  View Menu
                </Button>
              </Link>
            </div>

            {/* Vibe Highlights */}
            <div className="flex flex-wrap gap-3 pt-4">
              {[
                { icon: Leaf, label: 'Plants' },
                { icon: Music, label: 'Music' },
                { icon: BookOpen, label: 'Books' },
                { icon: Coffee, label: 'Peaceful' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 bg-secondary/50 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-secondary-foreground"
                >
                  <item.icon className="w-4 h-4 text-primary" />
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Floating Elements (visible on larger screens) */}
          <div className="hidden lg:block relative h-96">
            {/* Decorative floating cards */}
            <div className="absolute top-0 right-0 bg-card/90 backdrop-blur-sm p-4 rounded-2xl shadow-elevated animate-float stagger-1">
              <p className="text-2xl">☕</p>
              <p className="text-sm font-medium mt-1">Best Coffee</p>
            </div>
            <div className="absolute bottom-20 right-20 bg-card/90 backdrop-blur-sm p-4 rounded-2xl shadow-elevated animate-float stagger-2">
              <p className="text-2xl">🌿</p>
              <p className="text-sm font-medium mt-1">Green Vibes</p>
            </div>
            <div className="absolute top-32 right-48 bg-accent/90 backdrop-blur-sm p-4 rounded-2xl shadow-elevated animate-float stagger-3">
              <p className="text-2xl">🍕</p>
              <p className="text-sm font-medium mt-1">Fresh Food</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
