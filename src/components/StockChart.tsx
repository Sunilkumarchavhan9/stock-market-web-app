import React, { useEffect, useState, useRef } from 'react';
import { Paper, Box, Typography, Skeleton, CircularProgress } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  ChartData,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { format } from 'date-fns';
import { Stock } from '../context/StockContext';
import { fetchStockHistory, calculateStatistics } from '../services/stockService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface StockChartProps {
  stock: Stock | null;
  timeframe: number;
}

const StockChart: React.FC<StockChartProps> = ({ stock, timeframe }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [stats, setStats] = useState<{ average: number; standardDeviation: number }>({
    average: 0,
    standardDeviation: 0,
  });
  const chartRef = useRef<ChartJS>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!stock) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const history = await fetchStockHistory(stock.symbol, timeframe);
        setPriceHistory(history);
        
        const calculatedStats = calculateStatistics(history);
        setStats(calculatedStats);
      } catch (err) {
        console.error('Error fetching stock history:', err);
        setError('Failed to load stock data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [stock, timeframe]);

  const chartData: ChartData<'line'> = {
    datasets: [
      {
        label: stock?.name || 'Stock Price',
        data: priceHistory.map((item) => ({
          x: new Date(item.lastUpdatedAt),
          y: item.price,
        })),
        borderColor: '#1976D2',
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
        pointBackgroundColor: '#1976D2',
        pointRadius: 3,
        pointHoverRadius: 6,
        tension: 0.2,
        borderWidth: 2,
      },
      {
        label: 'Average',
        data: priceHistory.map((item) => ({
          x: new Date(item.lastUpdatedAt),
          y: stats.average,
        })),
        borderColor: '#EF6C00',
        backgroundColor: 'rgba(239, 108, 0, 0)',
        borderDash: [5, 5],
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: timeframe <= 60 ? 'minute' : 'hour',
          displayFormats: {
            minute: 'HH:mm',
            hour: 'HH:mm',
          },
        },
        title: {
          display: true,
          text: 'Time',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Price',
        },
        ticks: {
          callback: (value) => `$${value}`,
        },
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      tooltip: {
        callbacks: {
          title: (context) => {
            const date = new Date(context[0].parsed.x);
            return format(date, 'PPpp');
          },
          label: (context) => {
            if (context.dataset.label === 'Average') {
              return `Average: $${stats.average.toFixed(2)}`;
            }
            return `${context.dataset.label}: $${context.parsed.y.toFixed(2)}`;
          },
          afterLabel: (context) => {
            if (context.dataset.label !== 'Average') {
              return `Std Dev: $${stats.standardDeviation.toFixed(2)}`;
            }
            return '';
          },
        },
      },
      legend: {
        position: 'top',
      },
    },
    animation: {
      duration: 750,
      easing: 'easeOutQuart',
    },
  };

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 3, 
        borderRadius: 2, 
        height: '100%', 
        minHeight: 400,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          {stock ? stock.name : 'Select a Stock'}
        </Typography>
        {stock && (
          <Typography variant="subtitle1" color="text.secondary">
            {stock.symbol}
          </Typography>
        )}
      </Box>
      
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
      
      {!loading && !error && stock && priceHistory.length > 0 && (
        <>
          <Box sx={{ flexGrow: 1, minHeight: 300 }}>
            <Line ref={chartRef} data={chartData} options={chartOptions} />
          </Box>
          
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              mt: 3,
              p: 2,
              borderRadius: 1,
              bgcolor: 'background.default',
            }}
          >
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Average Price</Typography>
              <Typography variant="h6">${stats.average.toFixed(2)}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Standard Deviation</Typography>
              <Typography variant="h6">${stats.standardDeviation.toFixed(2)}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Data Points</Typography>
              <Typography variant="h6">{priceHistory.length}</Typography>
            </Box>
          </Box>
        </>
      )}
      
      {!loading && !error && (!stock || priceHistory.length === 0) && (
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
          {!stock ? (
            <Typography color="text.secondary">Select a stock to view price chart</Typography>
          ) : (
            <Typography color="text.secondary">No data available for the selected timeframe</Typography>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default StockChart;