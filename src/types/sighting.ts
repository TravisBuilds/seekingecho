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
  date: string;
  groupSize: number;
  startLocation: LatLng | null;
  endLocation: LatLng | null;
  matrilines: string[];
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

export interface LatLng {
  lat: number;
  lng: number;
}

export interface NewSighting {
  date: string;
  groupSize: number;
  startLocation?: LatLng;
  endLocation?: LatLng;
  matrilines: string[];
} 