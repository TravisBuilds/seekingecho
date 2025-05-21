'use client';

import { FormControl, Select, MenuItem, Box } from '@mui/material';
import { WhaleSighting } from '@/types/sighting';
import { WavesRounded } from '@mui/icons-material';
import Image from 'next/image';
import { useState } from 'react';

interface IndividualFilterProps {
  sightings: WhaleSighting[];
  onFilterChange: (selected: string[]) => void;
}

const IndividualFilter = ({ sightings, onFilterChange }: IndividualFilterProps) => {
  const [selectedValue, setSelectedValue] = useState("");
  const uniqueMatrilines = ['T18', 'T19'];

  const getIcon = (matriline: string) => {
    switch (matriline) {
      case 'T18':
        return <Image src="/images/orca-icon.png" alt="T18" width={24} height={24} />;
      case 'T19':
        return <Image src="/images/orca-icon2.png" alt="T19" width={24} height={24} />;
      default:
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Image src="/images/orca-icon.png" alt="T18" width={24} height={24} />
            <Image src="/images/orca-icon2.png" alt="T19" width={24} height={24} />
          </Box>
        );
    }
  };

  return (
    <FormControl>
      <Select
        value={selectedValue}
        onChange={(e) => {
          const value = e.target.value as string;
          setSelectedValue(value);
          const selectedValues = value === 'T18' 
            ? sightings.flatMap(s => s.matrilines).filter(m => m.startsWith('T18'))
            : value === 'T19'
              ? sightings.flatMap(s => s.matrilines).filter(m => m.startsWith('T19'))
              : value === ""  // When "All Whales" is selected
                ? sightings.flatMap(s => s.matrilines).filter(m => 
                    m.startsWith('T18') || m.startsWith('T19')
                  )
                : [value];
          onFilterChange(selectedValues);
        }}
        displayEmpty
        renderValue={(value) => (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 1,
            color: '#000000'
          }}>
            {getIcon(value as string)}
            <span style={{ color: '#000000' }}>{value === "" ? "All Whales" : value}</span>
          </Box>
        )}
        sx={{
          bgcolor: 'white',
          borderRadius: '50px',
          minWidth: 200,
          height: 48,
          boxShadow: 3,
          color: '#000000',
          '.MuiOutlinedInput-notchedOutline': { 
            borderRadius: '50px',
            borderColor: 'transparent'
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'transparent'
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'transparent'
          },
          '.MuiSelect-select': { 
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            py: 1.5,
            px: 2,
            color: '#000000'
          }
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              borderRadius: 3,
              mt: 1,
              boxShadow: 3,
              backgroundColor: '#FFFFFF',
              '.MuiMenuItem-root': {
                backgroundColor: '#FFFFFF',
                '&:hover': {
                  backgroundColor: '#F5F5F5'
                }
              }
            }
          }
        }}
      >
        <MenuItem value="">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#000000' }}>
            <WavesRounded />
            <span style={{ color: '#000000' }}>All Whales</span>
          </Box>
        </MenuItem>
        {uniqueMatrilines.map(matriline => (
          <MenuItem 
            key={matriline} 
            value={matriline}
            sx={{ py: 1.5, px: 2, color: '#000000' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getIcon(matriline)}
              <span style={{ color: '#000000' }}>{matriline}</span>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default IndividualFilter; 