export const mapStyles = [
  {
    // Water styling
    featureType: 'water',
    elementType: 'geometry',
    stylers: [
      { color: '#b3d1ff' }  // Light blue water
    ]
  },
  {
    // Land styling
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [
      { color: '#f5f5f5' }  // Light gray land
    ]
  },
  {
    // Remove road labels
    featureType: 'road',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }]
  },
  {
    // Simplify roads
    featureType: 'road',
    elementType: 'geometry',
    stylers: [
      { visibility: 'simplified' },
      { color: '#ffffff' }
    ]
  },
  {
    // Remove POIs
    featureType: 'poi',
    stylers: [{ visibility: 'off' }]
  },
  {
    // Administrative boundaries
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ visibility: 'simplified' }]
  }
]; 