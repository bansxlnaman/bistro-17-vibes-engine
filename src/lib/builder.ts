import { builder } from '@builder.io/react';

// Initialize Builder with API key from environment
builder.init(import.meta.env.VITE_BUILDER_PUBLIC_API_KEY);

// Export for use in other files
export { builder };
