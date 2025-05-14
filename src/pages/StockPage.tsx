import React, { useState } from 'react';
import { Grid, Box, Typography, Paper } from '@mui/material';
import StockSelector from '../components/StockSelector';
import TimeframeSelector from '../components/TimeframeSelector';
import StockChart from '../components/StockChart';
import { Stock, useStocks } from '../context/StockContext';

const StockPage: React.FC = () => {
  const { selectedTimeframe } = useStocks();
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Stock Analysis
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        View real-time stock price data and analytics
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Settings
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Select Stock
              </Typography>
              <StockSelector
                value={selectedStock}
                onChange={setSelectedStock}
              />
            </Box>
            
            <TimeframeSelector />
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={9}>
          <StockChart 
            stock={selectedStock}
            timeframe={selectedTimeframe}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default StockPage;