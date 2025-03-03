'use client';

import { useState, useEffect } from 'react';
import { WhaleSighting } from '@/types/sighting';

interface IndividualFilterProps {
  sightings: WhaleSighting[];
  onFilterChange: (selectedIndividuals: string[]) => void;
}

interface MatrilineGroup {
  [key: string]: {
    members: string[];
    subgroups?: { [key: string]: string[] };
  };
}

const IndividualFilter = ({ sightings, onFilterChange }: IndividualFilterProps) => {
  const [selectedMatriline, setSelectedMatriline] = useState<string>('');

  // Organize whales by matriline groups
  const organizeMatrilines = (): MatrilineGroup => {
    const allMatrilines = Array.from(
      new Set(
        sightings.flatMap(sighting =>
          sighting.matrilines
            .flatMap(line => line.split(/[,+]/).map(id => id.trim()))
            .filter(id => id && !id.includes('?'))
        )
      )
    ).sort();

    const groups: MatrilineGroup = {};
    
    allMatrilines.forEach(id => {
      // Extract the main group (e.g., "T18" from "T18B1")
      const mainGroup = id.match(/^(T\d+)/)?.[1];
      if (!mainGroup) return;

      if (!groups[mainGroup]) {
        groups[mainGroup] = { members: [], subgroups: {} };
      }

      if (id === mainGroup) {
        groups[mainGroup].members.push(id);
      } else {
        const subgroup = id.match(/^T\d+([A-Z])/)?.[1];
        if (subgroup) {
          if (!groups[mainGroup].subgroups![subgroup]) {
            groups[mainGroup].subgroups![subgroup] = [];
          }
          groups[mainGroup].subgroups![subgroup].push(id);
        }
      }
    });

    return groups;
  };

  const matrilineGroups = organizeMatrilines();

  const handleMatrilineChange = (value: string) => {
    setSelectedMatriline(value);
    if (value === '') {
      onFilterChange([]);
    } else {
      // If a main group is selected, include all subgroup members
      const mainGroup = value.match(/^(T\d+)/)?.[1];
      if (mainGroup && matrilineGroups[mainGroup]) {
        const allMembers = [
          ...matrilineGroups[mainGroup].members,
          ...Object.values(matrilineGroups[mainGroup].subgroups || {}).flat()
        ];
        onFilterChange(allMembers);
      } else {
        onFilterChange([value]);
      }
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Select Whale Group</h2>
      <select
        value={selectedMatriline}
        onChange={(e) => handleMatrilineChange(e.target.value)}
        className="w-full p-2 border rounded"
      >
        <option value="">All Whales</option>
        {Object.entries(matrilineGroups).map(([mainGroup, data]) => (
          <optgroup key={mainGroup} label={`${mainGroup} Family`}>
            <option value={mainGroup}>{mainGroup} (All)</option>
            {data.subgroups && Object.entries(data.subgroups).map(([subgroup, members]) => (
              members.map(member => (
                <option key={member} value={member}>
                  {member}
                </option>
              ))
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
};

export default IndividualFilter; 