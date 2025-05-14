import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import TimeframeSelector from '../components/TimeframeSelector';
import CorrelationHeatmap from '../components/CorrelationHeatmap';
import { useStocks } from '../context/StockContext';

const HeatmapPage: React.FC = () => {
  const { stocks, selectedTimeframe, loading, error } = useStocks();

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Correlation Heatmap
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        Analyze correlations between different stocks
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Settings
            </Typography>
            
            <TimeframeSelector />
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                About Correlation
              </Typography>
              <Typography variant="body2">
                Correlation values range from -1 (perfect negative correlation) to +1 (perfect positive correlation).
                Values close to 0 indicate little to no correlation between stocks.
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                How to use
              </Typography>
              <Typography variant="body2">
                Hover over any cell to see detailed correlation information.
                Hover over stock symbols to see average price and standard deviation.
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={9}>
          <CorrelationHeatmap 
            stocks={stocks}
            timeframe={selectedTimeframe}
            maxStocks={10}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default HeatmapPage;