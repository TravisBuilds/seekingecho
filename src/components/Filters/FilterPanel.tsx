'use client';

import { useState } from 'react';
import IndividualFilter from './IndividualFilter';
import { WhaleSighting } from '@/types/sighting';

interface FilterPanelProps {
  sightings: WhaleSighting[];
  onIndividualFilterChange: (selectedIndividuals: string[]) => void;
  onShowPathsChange: (showPaths: boolean) => void;
}

const FilterPanel = ({ sightings, onIndividualFilterChange, onShowPathsChange }: FilterPanelProps) => {
  const [showPaths, setShowPaths] = useState(true);

  const handleShowPathsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowPaths(e.target.checked);
    onShowPathsChange(e.target.checked);
  };

  return (
    <div className="space-y-6">
      <IndividualFilter 
        sightings={sightings}
        onFilterChange={onIndividualFilterChange}
      />
      
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Display Options</h2>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={showPaths}
            onChange={handleShowPathsChange}
            className="form-checkbox h-4 w-4 text-blue-600"
          />
          <span>Show Movement Paths</span>
        </label>
      </div>
    </div>
  );
};

export default FilterPanel; 