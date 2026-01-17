import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface CTASectionProps {
  title?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  backgroundStyle?: 'primary' | 'accent' | 'muted';
}

const CTASection = ({
  title = 'Ready to Order?',
  description = 'Browse our menu and place your order',
  buttonText = 'View Menu',
  buttonLink = '/menu',
  backgroundStyle = 'muted'
}: CTASectionProps) => {
  const bgClasses = {
    primary: 'bg-primary text-primary-foreground',
    accent: 'bg-accent text-accent-foreground',
    muted: 'bg-muted/30'
  };

  const bgClass = bgClasses[backgroundStyle];

  return (
    <section className={`py-20 ${bgClass}`}>
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          {title}
        </h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          {description}
        </p>
        <Link to={buttonLink}>
          <Button variant="hero" size="lg">
            {buttonText}
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default CTASection;
