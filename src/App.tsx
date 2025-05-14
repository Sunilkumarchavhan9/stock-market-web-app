import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import StockPage from './pages/StockPage';
import HeatmapPage from './pages/HeatmapPage';
import { StockProvider } from './context/StockContext';

function App() {
  return (
    <StockProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<StockPage />} />
          <Route path="/heatmap" element={<HeatmapPage />} />
        </Routes>
      </Layout>
    </StockProvider>
  );
}

export default App;