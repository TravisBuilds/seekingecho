import { Loader } from '@googlemaps/js-api-loader';

// Create a single loader instance that can be reused
export const mapsLoader = new Loader({
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  version: 'weekly',
  libraries: ['places'],
  language: 'en',
  region: 'US'
}); 