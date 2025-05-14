import React from 'react';
import { Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useStocks } from '../context/StockContext';

const timeframes = [
  { value: 15, label: '15m' },
  { value: 30, label: '30m' },
  { value: 60, label: '1h' },
  { value: 120, label: '2h' },
  { value: 240, label: '4h' },
  { value: 480, label: '8h' },
];

interface TimeframeSelectorProps {
  onChange?: (minutes: number) => void;
}

const TimeframeSelector: React.FC<TimeframeSelectorProps> = ({ onChange }) => {
  const { selectedTimeframe, setSelectedTimeframe } = useStocks();

  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    newTimeframe: number | null,
  ) => {
    if (newTimeframe !== null) {
      setSelectedTimeframe(newTimeframe);
      if (onChange) {
        onChange(newTimeframe);
      }
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Time Period
      </Typography>
      <ToggleButtonGroup
        value={selectedTimeframe}
        exclusive
        onChange={handleChange}
        aria-label="timeframe selection"
        size="small"
        sx={{ 
          '& .MuiToggleButtonGroup-grouped': {
            border: 1,
            borderColor: 'divider',
            '&.Mui-selected': {
              backgroundColor: 'primary.main',
              color: 'white',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
            },
          },
        }}
      >
        {timeframes.map((timeframe) => (
          <ToggleButton 
            key={timeframe.value} 
            value={timeframe.value}
            sx={{ 
              fontWeight: selectedTimeframe === timeframe.value ? 500 : 400,
              transition: 'all 0.2s ease-in-out',
            }}
          >
            {timeframe.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
};

export default TimeframeSelector;