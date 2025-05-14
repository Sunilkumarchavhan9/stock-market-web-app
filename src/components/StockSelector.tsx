import React, { useState } from 'react';
import { 
  Autocomplete, 
  TextField, 
  CircularProgress,
  Paper,
  Typography,
  Box
} from '@mui/material';
import { Stock, useStocks } from '../context/StockContext';

interface StockSelectorProps {
  label?: string;
  value: Stock | null;
  onChange: (stock: Stock | null) => void;
  disabled?: boolean;
}

const StockSelector: React.FC<StockSelectorProps> = ({ 
  label = 'Select Stock', 
  value, 
  onChange,
  disabled = false
}) => {
  const { stocks, loading } = useStocks();
  const [open, setOpen] = useState(false);

  const handleChange = (_event: React.SyntheticEvent, newValue: Stock | null) => {
    onChange(newValue);
  };

  return (
    <Autocomplete
      id="stock-selector"
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      value={value}
      onChange={handleChange}
      options={stocks}
      getOptionLabel={(option) => `${option.name} (${option.symbol})`}
      loading={loading}
      disabled={disabled}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          variant="outlined"
          size="small"
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <React.Fragment>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
        />
      )}
      renderOption={(props, option) => (
        <Box component={Paper} elevation={0} {...props}>
          <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.5 }}>
            <Typography variant="body2" component="span" fontWeight={500}>
              {option.name}
            </Typography>
            <Typography variant="caption" component="span" color="text.secondary">
              {option.symbol}
            </Typography>
          </Box>
        </Box>
      )}
      PaperComponent={({ children, ...other }) => (
        <Paper elevation={3} {...other} sx={{ mt: 0.5 }}>
          {children}
        </Paper>
      )}
      sx={{ width: '100%' }}
    />
  );
};

export default StockSelector;