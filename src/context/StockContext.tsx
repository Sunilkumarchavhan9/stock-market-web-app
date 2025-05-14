import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchStocks } from '../services/stockService';

export interface Stock {
  symbol: string;
  name: string;
}

interface StockContextType {
  stocks: Stock[];
  loading: boolean;
  error: string | null;
  selectedTimeframe: number;
  setSelectedTimeframe: (minutes: number) => void;
  retryLoading: () => void;
}

const StockContext = createContext<StockContextType>({
  stocks: [],
  loading: false,
  error: null,
  selectedTimeframe: 30,
  setSelectedTimeframe: () => {},
  retryLoading: () => {},
});

export const useStocks = () => useContext(StockContext);

export const StockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<number>(30);

  const loadStocks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const stocksData = await fetchStocks();
      
      const formattedStocks = Object.entries(stocksData.stocks).map(([name, symbol]) => ({
        name,
        symbol: symbol as string,
      }));
      
      setStocks(formattedStocks);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(`Unable to load stocks: ${errorMessage}. Please check if the API service is running and accessible, or try again later.`);
      console.error('Error loading stocks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const retryLoading = useCallback(() => {
    loadStocks();
  }, [loadStocks]);

  useEffect(() => {
    loadStocks();
  }, [loadStocks]);

  return (
    <StockContext.Provider 
      value={{ 
        stocks, 
        loading, 
        error, 
        selectedTimeframe, 
        setSelectedTimeframe,
        retryLoading
      }}
    >
      {children}
    </StockContext.Provider>
  );
};