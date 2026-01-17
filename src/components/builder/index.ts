import { Builder } from '@builder.io/react';
import MenuPreview from './MenuPreview';
import OrderNowButton from './OrderNowButton';
import CTASection from './CTASection';

// Register MenuPreview component
Builder.registerComponent(MenuPreview, {
  name: 'Menu Preview',
  inputs: [
    {
      name: 'itemCount',
      type: 'number',
      defaultValue: 4,
      helperText: 'Number of menu items to show'
    }
  ]
});

// Register OrderNowButton component
Builder.registerComponent(OrderNowButton, {
  name: 'Order Now Button',
  inputs: [
    {
      name: 'text',
      type: 'string',
      defaultValue: 'Order Now'
    },
    {
      name: 'variant',
      type: 'string',
      enum: ['hero', 'heroSecondary', 'accent', 'outline'],
      defaultValue: 'hero'
    },
    {
      name: 'linkTo',
      type: 'string',
      enum: ['/order', '/menu'],
      defaultValue: '/order'
    }
  ]
});

// Register CTASection component
Builder.registerComponent(CTASection, {
  name: 'CTA Section',
  inputs: [
    {
      name: 'title',
      type: 'string',
      defaultValue: 'Ready to Order?'
    },
    {
      name: 'description',
      type: 'string',
      defaultValue: 'Browse our menu and place your order'
    },
    {
      name: 'buttonText',
      type: 'string',
      defaultValue: 'View Menu'
    },
    {
      name: 'buttonLink',
      type: 'string',
      defaultValue: '/menu'
    },
    {
      name: 'backgroundStyle',
      type: 'string',
      enum: ['primary', 'accent', 'muted'],
      defaultValue: 'muted'
    }
  ]
});

// Export all components
export { default as MenuPreview } from './MenuPreview';
export { default as OrderNowButton } from './OrderNowButton';
export { default as CTASection } from './CTASection';
