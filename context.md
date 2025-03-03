# T18 Matriline Whale Sighting Visualization Project

## Project Overview
An interactive web application to visualize and analyze the movement patterns, social interactions, and habitat usage of the T18 matriline Bigg's killer whales in the Salish Sea region.

## Technical Stack
- **Frontend Framework**: React 18
- **Web Framework**: Next.js 14
- **Mapping**: Google Maps JavaScript API
- **State Management**: React Context API / Redux Toolkit
- **Data Visualization**: D3.js
- **Styling**: Tailwind CSS
- **Database**: MongoDB (for storing processed sighting data)

## Core Features

### 1. Interactive Map Visualization
- Google Maps integration with custom overlay layers
- Historical movement tracking with path visualization
- Custom markers for whale sightings with popup information
- Heat map visualization option for frequently visited areas

### 2. Advanced Filtering System
- Date range selector (seasonal patterns)
- Location-based filtering (specific areas of the Salish Sea)
- Group size filtering
- Pod composition filters
- Real-time filter updates on map

### 3. Time-lapse Animation
- Custom animation controls (play, pause, speed adjustment)
- Monthly/yearly progression visualization
- Timeline slider for manual navigation
- Animation of whale movements along recorded paths

### 4. Social Network Analysis
- Force-directed graph visualization using D3.js
- Pod interaction patterns
- Relationship strength indicators
- Interactive network exploration
- Temporal analysis of social bonds

### 5. Maritime Traffic Integration
- NOAA shipping route overlay
- Commercial fishing activity zones
- Toggle controls for different maritime layers
- Temporal correlation between whale movements and maritime traffic

## Data Structure

### Whale Sighting Data

Project Structure:

src/
├── components/
│ ├── Map/
│ ├── Filters/
│ ├── Timeline/
│ ├── SocialNetwork/
│ └── MaritimeOverlay/
├── hooks/
│ ├── useMapData.ts
│ ├── useSightings.ts
│ └── useMaritimeData.ts
├── services/
│ ├── api/
│ └── utils/
├── types/
├── styles/
└── pages/


## API Requirements
1. Google Maps JavaScript API
2. NOAA Maritime Data API
3. Custom REST API for sighting data

## Development Phases
1. **Phase 1**: Basic map setup and data visualization
2. **Phase 2**: Filtering system implementation
3. **Phase 3**: Time-lapse animation development
4. **Phase 4**: Social network analysis integration
5. **Phase 5**: Maritime traffic overlay implementation
6. **Phase 6**: Performance optimization and testing

## Performance Considerations
- Data chunking for large datasets
- Progressive loading for historical data
- Client-side caching strategies
- Optimized rendering for animations
- Efficient state management for real-time updates

## Environmental Variables