# Builder.io Integration Setup Guide

This project now supports custom landing pages for each café using Builder.io.

## Setup Instructions

### 1. Get Builder.io API Key

1. Go to [builder.io](https://builder.io) and create an account
2. Navigate to your organization settings
3. Copy your **Public API Key**
4. Update `.env` file:
   ```
   VITE_BUILDER_PUBLIC_API_KEY=your_actual_api_key_here
   ```

### 2. Create Builder.io Model

1. In Builder.io dashboard, go to **Models**
2. Create a new model:
   - Name: `landing-page`
   - Type: **Page**
   - URL pattern: `/`
3. Add custom targeting fields:
   - Field name: `domain` (type: text)
   - Field name: `cafeId` (type: text)

### 3. Create Landing Pages

1. In Builder.io, create a new **landing-page** entry
2. Set targeting fields:
   - `domain`: Your café's domain (e.g., `mycafe.example.com`)
   - `cafeId`: Your café's UUID from database
3. Design your landing page using the visual editor
4. **Custom components available:**
   - **Menu Preview**: Shows popular menu items from your database
   - **Order Now Button**: CTA button linking to /order or /menu
   - **CTA Section**: Full-width call-to-action section
5. Publish your changes

## Architecture

- **Main domain** (`cafes-test.vercel.app`): Shows original marketing site (Index page)
- **Tenant domains** (e.g., `mycafe.example.com`): Shows Builder.io landing page
- All other routes unchanged: `/menu`, `/cart`, `/order`, `/admin`, etc.

## Custom Components

### Menu Preview
Shows popular menu items fetched from Supabase.

**Props:**
- `itemCount` (number): Number of items to display (default: 4)

### Order Now Button
Styled button that links to app routes.

**Props:**
- `text` (string): Button text (default: "Order Now")
- `variant` (string): Button style - hero, heroSecondary, accent, outline
- `linkTo` (string): Route to link to - /order or /menu

### CTA Section
Full-width call-to-action section.

**Props:**
- `title` (string): Section heading
- `description` (string): Section description
- `buttonText` (string): Button text
- `buttonLink` (string): Route to link to
- `backgroundStyle` (string): Background style - primary, accent, muted

## Theme Integration

Landing pages automatically inherit your café's theme colors (primary and accent) defined in the database. All Tailwind classes work in Builder.io editor.

## Security

- RLS (Row Level Security) remains enforced
- Menu data automatically scoped to correct café
- Builder.io uses public API key (safe for client)
- No cross-café data access possible

## Troubleshooting

**Landing page not loading:**
- Check `VITE_BUILDER_PUBLIC_API_KEY` is set correctly
- Verify `domain` and `cafeId` fields match in Builder.io
- Check that content is published (not draft)

**Custom components not appearing:**
- Components are registered automatically when TenantLanding loads
- Refresh Builder.io editor if needed

**Menu items not showing:**
- Ensure menu items exist in database for that café
- Check `is_popular` flag is set for items
- Verify `is_available` is true
