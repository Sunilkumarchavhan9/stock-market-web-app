import axios, { AxiosError } from 'axios';

const API_BASE_URL = 'https://20.244.56.144/evaluation-service';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  // Add additional headers that might be required by the API
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
});

// Cache to store recent API responses
interface CacheItem {
  data: any;
  timestamp: number;
}

const cache: Record<string, CacheItem> = {};
const CACHE_DURATION = 30 * 1000; // 30 seconds cache duration

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

// Helper function for exponential backoff delay
const getRetryDelay = (retryCount: number) => {
  return INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
};

// Helper function to get cached data or fetch new data with retry mechanism
const getCachedOrFetch = async (key: string, fetchFn: () => Promise<any>) => {
  const now = Date.now();
  const cachedItem = cache[key];
  
  if (cachedItem && now - cachedItem.timestamp < CACHE_DURATION) {
    return cachedItem.data;
  }
  
  let lastError: Error | null = null;
  
  for (let retryCount = 0; retryCount <= MAX_RETRIES; retryCount++) {
    try {
      const data = await fetchFn();
      cache[key] = { data, timestamp: now };
      return data;
    } catch (error) {
      lastError = error as Error;
      
      if (retryCount < MAX_RETRIES) {
        const delay = getRetryDelay(retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // If we get here, all retries failed
  const errorMessage = lastError instanceof AxiosError 
    ? `API Error: ${lastError.message}`
    : 'An unexpected error occurred';
  
  throw new Error(`Failed after ${MAX_RETRIES} retries: ${errorMessage}`);
};

// Fetch all stocks
export const fetchStocks = async () => {
  return getCachedOrFetch('all_stocks', async () => {
    try {
      const response = await api.get('/stocks');
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Request timed out. Please check your internet connection.');
        }
        if (error.response?.status === 403) {
          throw new Error('Access to the API is forbidden. Please check your credentials.');
        }
        if (error.response?.status === 404) {
          throw new Error('The requested resource was not found.');
        }
        if (error.code === 'ERR_BAD_REQUEST') {
          throw new Error('Invalid request. Please check the API documentation.');
        }
        if (error.code === 'CERT_HAS_EXPIRED') {
          throw new Error('SSL certificate validation failed. Please check the API endpoint configuration.');
        }
      }
      throw error;
    }
  });
};

// Fetch stock price
export const fetchStockPrice = async (ticker: string) => {
  return getCachedOrFetch(`stock_price_${ticker}`, async () => {
    const response = await api.get(`/stocks/${ticker}`);
    return response.data;
  });
};

// Fetch stock price history
export const fetchStockHistory = async (ticker: string, minutes: number) => {
  const cacheKey = `stock_history_${ticker}_${minutes}`;
  return getCachedOrFetch(cacheKey, async () => {
    const response = await api.get(`/stocks/${ticker}?minutes=${minutes}`);
    return Array.isArray(response.data) ? response.data : [];
  });
};

// Calculate statistics for a stock's price history
export const calculateStatistics = (priceHistory: any[]) => {
  if (!priceHistory || priceHistory.length === 0) {
    return { average: 0, standardDeviation: 0 };
  }
  
  const prices = priceHistory.map(item => item.price);
  const sum = prices.reduce((acc, price) => acc + price, 0);
  const average = sum / prices.length;
  
  const squaredDiffs = prices.map(price => Math.pow(price - average, 2));
  const variance = squaredDiffs.reduce((acc, diff) => acc + diff, 0) / prices.length;
  const standardDeviation = Math.sqrt(variance);
  
  return { average, standardDeviation };
};

// Calculate correlation between two stocks
export const calculateCorrelation = (stockAHistory: any[], stockBHistory: any[]) => {
  if (!stockAHistory || !stockBHistory || stockAHistory.length < 2 || stockBHistory.length < 2) {
    return 0;
  }
  
  // Extract timestamps and match data points from both stocks
  const alignedData = alignTimeSeriesData(stockAHistory, stockBHistory);
  
  if (alignedData.length < 2) {
    return 0;
  }
  
  const xValues = alignedData.map(point => point.stockAPrice);
  const yValues = alignedData.map(point => point.stockBPrice);
  
  // Calculate means
  const xMean = xValues.reduce((acc, val) => acc + val, 0) / xValues.length;
  const yMean = yValues.reduce((acc, val) => acc + val, 0) / yValues.length;
  
  // Calculate covariance and standard deviations
  let covariance = 0;
  let xVariance = 0;
  let yVariance = 0;
  
  for (let i = 0; i < alignedData.length; i++) {
    const xDiff = xValues[i] - xMean;
    const yDiff = yValues[i] - yMean;
    
    covariance += xDiff * yDiff;
    xVariance += xDiff * xDiff;
    yVariance += yDiff * yDiff;
  }
  
  covariance /= (alignedData.length - 1);
  xVariance /= (alignedData.length - 1);
  yVariance /= (alignedData.length - 1);
  
  const xStdDev = Math.sqrt(xVariance);
  const yStdDev = Math.sqrt(yVariance);
  
  // Calculate Pearson correlation coefficient
  if (xStdDev === 0 || yStdDev === 0) {
    return 0;
  }
  
  return covariance / (xStdDev * yStdDev);
};

// Helper function to align time series data between two stocks
const alignTimeSeriesData = (stockAHistory: any[], stockBHistory: any[]) => {
  const alignedData: { timestamp: string; stockAPrice: number; stockBPrice: number }[] = [];
  
  // Create maps of timestamp to price for easy lookup
  const stockAMap = new Map();
  const stockBMap = new Map();
  
  stockAHistory.forEach(item => {
    stockAMap.set(item.lastUpdatedAt, item.price);
  });
  
  stockBHistory.forEach(item => {
    stockBMap.set(item.lastUpdatedAt, item.price);
  });
  
  // Find timestamps that exist in both datasets
  for (const timestamp of stockAMap.keys()) {
    if (stockBMap.has(timestamp)) {
      alignedData.push({
        timestamp,
        stockAPrice: stockAMap.get(timestamp),
        stockBPrice: stockBMap.get(timestamp)
      });
    }
  }
  
  return alignedData;
};