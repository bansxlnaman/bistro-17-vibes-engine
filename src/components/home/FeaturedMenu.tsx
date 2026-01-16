import { Link } from 'react-router-dom';
import { Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMenuItems, getPopularItems } from '@/hooks/useMenuItems';
import { useCart } from '@/context/CartContext';
import cappuccino from '@/assets/cappuccino.jpg';
import fries from '@/assets/peri-peri-fries.jpg';
import pasta from '@/assets/pasta.jpg';
import brownie from '@/assets/brownie.jpg';

const imageMap: Record<string, string> = {
  'd1': cappuccino,
  's1': fries,
  'p4': pasta,
  'ds1': brownie,
};

const FeaturedMenu = () => {
  const { data: menuItems = [], isLoading } = useMenuItems();
  const popularItems = getPopularItems(menuItems).slice(0, 4);
  const { addItem } = useCart();

  if (isLoading) {
    return (
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-pulse">Loading featured items...</div>
          </div>
        </div>
      </section>
    );
  }

  if (popularItems.length === 0) {
    return null; // Don't show section if no popular items
  }

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12 animate-fade-up">
          <span className="inline-block bg-primary/10 text-primary text-sm font-medium px-4 py-1 rounded-full mb-4">
            Best Sellers
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
            Our Crowd Favorites
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Handpicked favorites that keep our guests coming back for more
          </p>
        </div>

        {/* Featured Items Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {popularItems.map((item, index) => (
            <div
              key={item.id}
              className="group bg-card rounded-2xl overflow-hidden shadow-card card-hover animate-fade-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={item.image || imageMap[item.id] || cappuccino}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <span className={item.isVeg ? 'veg-badge' : 'non-veg-badge'} />
                </div>
                {item.isPopular && (
                  <div className="absolute top-3 right-3 bg-accent text-accent-foreground text-xs font-bold px-2 py-1 rounded-full">
                    Popular
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-lg text-foreground mb-1">
                  {item.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {item.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">
                    ₹{item.price}
                  </span>
                  <Button
                    variant="accent"
                    size="icon"
                    className="rounded-full h-9 w-9"
                    onClick={() => addItem(item)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View Full Menu Button */}
        <div className="text-center">
          <Link to="/menu">
            <Button variant="outline" size="lg" className="group">
              View Full Menu
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedMenu;
