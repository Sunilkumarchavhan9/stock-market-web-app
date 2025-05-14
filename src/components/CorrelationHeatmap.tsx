import React, { useEffect, useState, useCallback } from 'react';
import { Paper, Box, Typography, CircularProgress, Tooltip, Skeleton } from '@mui/material';
import { Stock } from '../context/StockContext';
import { fetchStockHistory, calculateCorrelation } from '../services/stockService';

interface CorrelationHeatmapProps {
  stocks: Stock[];
  timeframe: number;
  maxStocks?: number;
}

const CorrelationHeatmap: React.FC<CorrelationHeatmapProps> = ({ 
  stocks, 
  timeframe,
  maxStocks = 10
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [correlationMatrix, setCorrelationMatrix] = useState<number[][]>([]);
  const [stockHistories, setStockHistories] = useState<Record<string, any[]>>({});
  const [hoveredCell, setHoveredCell] = useState<[number, number] | null>(null);
  
  const visibleStocks = stocks.slice(0, maxStocks);

  const fetchAllStockHistories = useCallback(async () => {
    if (visibleStocks.length === 0) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const histories: Record<string, any[]> = {};
      
      // Fetch stock histories in parallel
      const promises = visibleStocks.map(async (stock) => {
        try {
          const history = await fetchStockHistory(stock.symbol, timeframe);
          return { symbol: stock.symbol, history };
        } catch (error) {
          console.error(`Error fetching history for ${stock.symbol}:`, error);
          return { symbol: stock.symbol, history: [] };
        }
      });
      
      const results = await Promise.all(promises);
      
      results.forEach(({ symbol, history }) => {
        histories[symbol] = history;
      });
      
      setStockHistories(histories);
      
      // Calculate correlation matrix
      const matrix: number[][] = [];
      
      for (let i = 0; i < visibleStocks.length; i++) {
        const row: number[] = [];
        const stockA = visibleStocks[i];
        const historyA = histories[stockA.symbol] || [];
        
        for (let j = 0; j < visibleStocks.length; j++) {
          const stockB = visibleStocks[j];
          const historyB = histories[stockB.symbol] || [];
          
          if (i === j) {
            row.push(1); // Same stock has perfect correlation with itself
          } else {
            const correlation = calculateCorrelation(historyA, historyB);
            row.push(correlation);
          }
        }
        
        matrix.push(row);
      }
      
      setCorrelationMatrix(matrix);
    } catch (err) {
      console.error('Error calculating correlation matrix:', err);
      setError('Failed to generate correlation heatmap. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [visibleStocks, timeframe]);

  useEffect(() => {
    fetchAllStockHistories();
  }, [fetchAllStockHistories]);

  const getCorrelationColor = (value: number) => {
    if (value >= 0.8) return '#0571b0'; // Strong positive
    if (value >= 0.5) return '#6baed6'; // Moderate positive
    if (value >= 0.2) return '#bdd7e7'; // Weak positive
    if (value > -0.2) return '#f7f7f7'; // Negligible
    if (value > -0.5) return '#fcae91'; // Weak negative
    if (value > -0.8) return '#fb6a4a'; // Moderate negative
    return '#a50f15'; // Strong negative
  };

  const getCorrelationLabel = (value: number) => {
    if (value >= 0.8) return 'Strong positive';
    if (value >= 0.5) return 'Moderate positive';
    if (value >= 0.2) return 'Weak positive';
    if (value > -0.2) return 'Negligible';
    if (value > -0.5) return 'Weak negative';
    if (value > -0.8) return 'Moderate negative';
    return 'Strong negative';
  };

  // Get statistics for a specific stock
  const getStockStats = (stockIndex: number) => {
    if (stockIndex >= visibleStocks.length) return { avg: 0, stdDev: 0 };
    
    const stock = visibleStocks[stockIndex];
    const history = stockHistories[stock.symbol] || [];
    
    if (history.length === 0) return { avg: 0, stdDev: 0 };
    
    const prices = history.map(item => item.price);
    const sum = prices.reduce((acc, val) => acc + val, 0);
    const avg = sum / prices.length;
    
    const sumSqDiff = prices.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0);
    const stdDev = Math.sqrt(sumSqDiff / (prices.length - 1));
    
    return { avg, stdDev };
  };

  return (
    <Paper 
      elevation={2}
      sx={{ 
        p: 3, 
        borderRadius: 2, 
        minHeight: 500,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography variant="h5" component="h2" gutterBottom>
        Correlation Heatmap
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
        Last {timeframe} minutes
      </Typography>
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
          <CircularProgress />
        </Box>
      )}
      
      {error && !loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}
      
      {!loading && !error && visibleStocks.length > 0 && correlationMatrix.length > 0 && (
        <>
          <Box 
            sx={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              overflowX: 'auto',
              pb: 2
            }}
          >
            <Box 
              sx={{ 
                display: 'grid',
                gridTemplateColumns: `auto repeat(${visibleStocks.length}, 1fr)`,
                gap: 0.5,
                alignItems: 'center',
                width: 'fit-content',
                minWidth: '100%',
              }}
            >
              {/* Empty corner */}
              <Box sx={{ width: 90, height: 90 }}></Box>
              
              {/* Column headers */}
              {visibleStocks.map((stock, index) => (
                <Tooltip
                  key={`col-${stock.symbol}`}
                  title={
                    <Box>
                      <Typography variant="body2">{stock.name}</Typography>
                      {hoveredCell === null && (
                        <>
                          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                            Avg: ${getStockStats(index).avg.toFixed(2)}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Std Dev: ${getStockStats(index).stdDev.toFixed(2)}
                          </Typography>
                        </>
                      )}
                    </Box>
                  }
                  arrow
                >
                  <Box 
                    sx={{ 
                      width: 70, 
                      maxWidth: 70,
                      height: 90,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: 'rotate(-45deg)',
                      transformOrigin: 'center',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      color: 'text.secondary',
                      fontWeight: 500,
                      fontSize: '0.75rem',
                      '&:hover': {
                        color: 'primary.main',
                      },
                    }}
                  >
                    {stock.symbol}
                  </Box>
                </Tooltip>
              ))}
              
              {/* Row headers and heatmap cells */}
              {visibleStocks.map((rowStock, rowIndex) => (
                <React.Fragment key={`row-${rowStock.symbol}`}>
                  {/* Row header */}
                  <Tooltip
                    title={
                      <Box>
                        <Typography variant="body2">{rowStock.name}</Typography>
                        {hoveredCell === null && (
                          <>
                            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                              Avg: ${getStockStats(rowIndex).avg.toFixed(2)}
                            </Typography>
                            <Typography variant="caption" display="block">
                              Std Dev: ${getStockStats(rowIndex).stdDev.toFixed(2)}
                            </Typography>
                          </>
                        )}
                      </Box>
                    }
                    arrow
                  >
                    <Box 
                      sx={{ 
                        padding: 1, 
                        backgroundColor: 'background.default',
                        width: 90,
                        maxWidth: 90,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontWeight: 500,
                        '&:hover': {
                          color: 'primary.main',
                        },
                      }}
                    >
                      {rowStock.symbol}
                    </Box>
                  </Tooltip>
                  
                  {/* Heatmap cells */}
                  {visibleStocks.map((colStock, colIndex) => {
                    const correlation = correlationMatrix[rowIndex][colIndex];
                    
                    return (
                      <Tooltip
                        key={`cell-${rowIndex}-${colIndex}`}
                        title={
                          <Box>
                            <Typography variant="body2">
                              {rowStock.symbol} vs {colStock.symbol}
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              Correlation: {correlation.toFixed(2)}
                            </Typography>
                            <Typography variant="caption">
                              {getCorrelationLabel(correlation)}
                            </Typography>
                            
                            {/* Show statistics when cell is hovered */}
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption" display="block">
                                {rowStock.symbol} - Avg: ${getStockStats(rowIndex).avg.toFixed(2)}, 
                                StdDev: ${getStockStats(rowIndex).stdDev.toFixed(2)}
                              </Typography>
                              <Typography variant="caption" display="block">
                                {colStock.symbol} - Avg: ${getStockStats(colIndex).avg.toFixed(2)}, 
                                StdDev: ${getStockStats(colIndex).stdDev.toFixed(2)}
                              </Typography>
                            </Box>
                          </Box>
                        }
                        arrow
                      >
                        <Box 
                          sx={{ 
                            width: 70, 
                            height: 70, 
                            backgroundColor: getCorrelationColor(correlation),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'transform 0.2s ease',
                            '&:hover': {
                              transform: 'scale(1.1)',
                              zIndex: 1,
                              boxShadow: 3,
                            },
                            cursor: 'pointer',
                          }}
                          onMouseEnter={() => setHoveredCell([rowIndex, colIndex])}
                          onMouseLeave={() => setHoveredCell(null)}
                        >
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: Math.abs(correlation) > 0.5 ? 'white' : 'black',
                              fontWeight: 500,
                            }}
                          >
                            {correlation.toFixed(2)}
                          </Typography>
                        </Box>
                      </Tooltip>
                    );
                  })}
                </React.Fragment>
              ))}
            </Box>
          </Box>
          
          {/* Legend */}
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              mt: 3,
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              <Box 
                sx={{ 
                  width: 20, 
                  height: 20, 
                  backgroundColor: '#a50f15', 
                  mr: 1 
                }}
              />
              <Typography variant="caption">Strong negative</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              <Box 
                sx={{ 
                  width: 20, 
                  height: 20, 
                  backgroundColor: '#fb6a4a', 
                  mr: 1 
                }}
              />
              <Typography variant="caption">Moderate negative</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              <Box 
                sx={{ 
                  width: 20, 
                  height: 20, 
                  backgroundColor: '#fcae91', 
                  mr: 1 
                }}
              />
              <Typography variant="caption">Weak negative</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              <Box 
                sx={{ 
                  width: 20, 
                  height: 20, 
                  backgroundColor: '#f7f7f7', 
                  mr: 1 
                }}
              />
              <Typography variant="caption">Negligible</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              <Box 
                sx={{ 
                  width: 20, 
                  height: 20, 
                  backgroundColor: '#bdd7e7', 
                  mr: 1 
                }}
              />
              <Typography variant="caption">Weak positive</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              <Box 
                sx={{ 
                  width: 20, 
                  height: 20, 
                  backgroundColor: '#6baed6', 
                  mr: 1 
                }}
              />
              <Typography variant="caption">Moderate positive</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box 
                sx={{ 
                  width: 20, 
                  height: 20, 
                  backgroundColor: '#0571b0', 
                  mr: 1 
                }}
              />
              <Typography variant="caption">Strong positive</Typography>
            </Box>
          </Box>
        </>
      )}
      
      {!loading && !error && (visibleStocks.length === 0 || correlationMatrix.length === 0) && (
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            flexGrow: 1,
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Typography color="text.secondary">
            No stock data available to generate correlation heatmap
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default CorrelationHeatmap;