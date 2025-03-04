'use client';

import { WhaleSighting } from '@/types/sighting';

interface IndividualFilterProps {
  sightings: WhaleSighting[];
  onFilterChange: (selected: string[]) => void;
}

const IndividualFilter = ({ sightings, onFilterChange }: IndividualFilterProps) => {
  // Get unique matrilines
  const uniqueMatrilines = Array.from(
    new Set(
      sightings.flatMap(sighting => sighting.matrilines)
    )
  ).sort();

  return (
    <div className="relative" style={{ zIndex: 1000 }}>
      <select 
        className="appearance-none px-6 py-3 bg-white rounded-full border shadow-lg text-lg min-w-[200px]"
        onChange={(e) => onFilterChange([e.target.value])}
        value=""
      >
        <option value="">All Whales</option>
        {uniqueMatrilines.map(matriline => (
          <option key={matriline} value={matriline}>
            {matriline}
          </option>
        ))}
      </select>
    </div>
  );
};

export default IndividualFilter; 