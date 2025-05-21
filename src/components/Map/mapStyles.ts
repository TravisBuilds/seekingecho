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
    // Water labels
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [
      { color: '#000000' }  // Black text fill
    ]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [
      { color: '#FFFFFF' },  // White outline
      { weight: 3 }  // Thicker outline
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
    // Land labels fill
    featureType: 'landscape',
    elementType: 'labels.text.fill',
    stylers: [
      { color: '#000000' }  // Black text fill
    ]
  },
  {
    // Land labels stroke
    featureType: 'landscape',
    elementType: 'labels.text.stroke',
    stylers: [
      { color: '#FFFFFF' },  // White outline
      { weight: 3 }  // Thicker outline
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
      { color: '#ffffff' }  // White roads
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
  },
  {
    // Administrative labels fill
    featureType: 'administrative',
    elementType: 'labels.text.fill',
    stylers: [
      { color: '#000000' }  // Black text fill
    ]
  },
  {
    // Administrative labels stroke
    featureType: 'administrative',
    elementType: 'labels.text.stroke',
    stylers: [
      { color: '#FFFFFF' },  // White outline
      { weight: 3 }  // Thicker outline
    ]
  }
]; 