export interface Location {
  lat: number;
  lng: number;
}

export interface WhaleIndividual {
  id: string;
  name: string;
  birthYear?: number;
  mother?: string;
}

export interface WhaleSighting {
  id: string;
  timestamp: string;
  location: {
    lat: number;
    lng: number;
  };
  endLocation: {
    lat: number;
    lng: number;
  } | null;
  matrilines: string[];
  groupSize: number;
  firstLocation: string;
  endLocationName: string;
  firstDirection: string;
  endDirection: string;
  firstTime: string;
  endTime: string;
}

export interface TimelineControls {
  isPlaying: boolean;
  speed: number;
  currentDate: Date;
  startDate: Date;
  endDate: Date;
}

export interface FilterOptions {
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  location: string;
  groupSize: {
    min: number;
    max: number;
  };
  matrilines: string[];
  showPath: boolean;
} 