import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BuilderComponent } from '@builder.io/react';
import { builder } from '@/lib/builder';
import { useCafe } from '@/context/CafeContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import FloatingCart from '@/components/cart/FloatingCart';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import '@/components/builder'; // Registers custom components

const TenantLanding = () => {
  const { cafe, loading: cafeLoading, error: cafeError } = useCafe();
  const [content, setContent] = useState<any>(null);
  const [builderLoading, setBuilderLoading] = useState(true);
  const [builderError, setBuilderError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBuilderContent = async () => {
      if (!cafe) return;

      setBuilderLoading(true);
      setBuilderError(null);

      try {
        const builderContent = await builder
          .get('landing-page', {
            userAttributes: {
              domain: cafe.domain,
              cafeId: cafe.id
            }
          })
          .promise();

        setContent(builderContent);
      } catch (error) {
        console.error('Failed to load Builder content:', error);
        setBuilderError('Failed to load page content');
      } finally {
        setBuilderLoading(false);
      }
    };

    if (cafe?.id) {
      fetchBuilderContent();
    }
  }, [cafe]);

  // Loading state for cafe
  if (cafeLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <div className="animate-pulse">
                <div className="h-12 bg-muted rounded w-64 mx-auto mb-4"></div>
                <div className="h-6 bg-muted rounded w-96 mx-auto"></div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
        <FloatingCart />
      </div>
    );
  }

  // Error state for cafe
  if (cafeError) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="py-20">
          <div className="container mx-auto px-4">
            <Card className="max-w-md mx-auto p-8 text-center">
              <h2 className="text-2xl font-bold text-destructive mb-4">Error</h2>
              <p className="text-muted-foreground">{cafeError}</p>
            </Card>
          </div>
        </main>
        <Footer />
        <FloatingCart />
      </div>
    );
  }

  // Loading state for Builder content
  if (builderLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <div className="animate-pulse">
                <div className="h-12 bg-muted rounded w-64 mx-auto mb-4"></div>
                <div className="h-6 bg-muted rounded w-96 mx-auto mb-8"></div>
                <div className="h-64 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
        <FloatingCart />
      </div>
    );
  }

  // Error state for Builder content
  if (builderError) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="py-20">
          <div className="container mx-auto px-4">
            <Card className="max-w-md mx-auto p-8 text-center">
              <h2 className="text-2xl font-bold text-destructive mb-4">Error</h2>
              <p className="text-muted-foreground mb-6">{builderError}</p>
              <Link to="/menu">
                <Button variant="hero">View Menu</Button>
              </Link>
            </Card>
          </div>
        </main>
        <Footer />
        <FloatingCart />
      </div>
    );
  }

  // No Builder content found - show fallback
  if (!content) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="py-20">
          <div className="container mx-auto px-4">
            <Card className="max-w-2xl mx-auto p-8 text-center">
              <h1 className="text-4xl font-bold mb-4">{cafe?.name}</h1>
              {cafe?.description && (
                <p className="text-lg text-muted-foreground mb-6">
                  {cafe.description}
                </p>
              )}
              <div className="bg-muted/30 rounded-lg p-6 mb-6">
                <p className="text-muted-foreground mb-4">
                  Landing page not configured yet
                </p>
              </div>
              <Link to="/menu">
                <Button variant="hero" size="lg">
                  View Menu
                </Button>
              </Link>
            </Card>
          </div>
        </main>
        <Footer />
        <FloatingCart />
      </div>
    );
  }

  // Render Builder content
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <BuilderComponent model="landing-page" content={content} />
      </main>
      <Footer />
      <FloatingCart />
    </div>
  );
};

export default TenantLanding;
