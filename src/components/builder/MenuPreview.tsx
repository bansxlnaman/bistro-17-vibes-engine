import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMenuItems, getPopularItems } from '@/hooks/useMenuItems';
import { useCart } from '@/context/CartContext';
import cappuccino from '@/assets/cappuccino.jpg';

interface MenuPreviewProps {
  itemCount?: number;
}

const MenuPreview = ({ itemCount = 4 }: MenuPreviewProps) => {
  const { data: menuItems = [], isLoading } = useMenuItems();
  const popularItems = getPopularItems(menuItems).slice(0, itemCount);
  const { addItem } = useCart();

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="text-center animate-pulse">Loading menu...</div>
      </div>
    );
  }

  if (popularItems.length === 0) {
    return null;
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {popularItems.map((item, index) => (
        <div
          key={item.id}
          className="group bg-card rounded-2xl overflow-hidden shadow-card card-hover animate-fade-up"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          {/* Image */}
          <div className="relative h-48 overflow-hidden">
            <img
              src={item.image || cappuccino}
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
  );
};

export default MenuPreview;
