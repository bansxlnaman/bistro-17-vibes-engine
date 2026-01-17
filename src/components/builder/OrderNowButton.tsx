import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface OrderNowButtonProps {
  text?: string;
  variant?: 'hero' | 'heroSecondary' | 'accent' | 'outline';
  linkTo?: '/order' | '/menu';
}

const OrderNowButton = ({
  text = 'Order Now',
  variant = 'hero',
  linkTo = '/order'
}: OrderNowButtonProps) => {
  return (
    <Link to={linkTo}>
      <Button variant={variant} size="lg">
        {text}
      </Button>
    </Link>
  );
};

export default OrderNowButton;
