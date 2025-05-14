import React from 'react';
import { AppBar, Toolbar, Typography, Box, Container, Paper, useMediaQuery } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { BarChart2, TrendingUp } from 'lucide-react';

interface NavItemProps {
  label: string;
  icon: React.ReactNode;
  path: string;
  active: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ label, icon, active, onClick }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      py: 1.5,
      px: 2,
      borderRadius: 1,
      cursor: 'pointer',
      mb: 1,
      backgroundColor: active ? 'primary.main' : 'transparent',
      color: active ? 'white' : 'text.secondary',
      '&:hover': {
        backgroundColor: active ? 'primary.main' : 'action.hover',
      },
      transition: 'background-color 0.2s ease-in-out',
    }}
    onClick={onClick}
  >
    <Box sx={{ mr: 1.5 }}>{icon}</Box>
    <Typography variant="body2" fontWeight={active ? 500 : 400}>
      {label}
    </Typography>
  </Box>
);

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width:600px)');

  const navItems = [
    {
      label: 'Stock Analysis',
      icon: <TrendingUp size={20} />,
      path: '/',
    },
    {
      label: 'Correlation Heatmap',
      icon: <BarChart2 size={20} />,
      path: '/heatmap',
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Stock Exchange Analytics
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        {!isMobile && (
          <Box
            component={Paper}
            elevation={0}
            sx={{
              width: 240,
              borderRight: '1px solid',
              borderColor: 'divider',
              padding: 2,
            }}
          >
            {navItems.map((item) => (
              <NavItem
                key={item.path}
                label={item.label}
                icon={item.icon}
                path={item.path}
                active={location.pathname === item.path}
                onClick={() => navigate(item.path)}
              />
            ))}
          </Box>
        )}
        
        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
          <Container maxWidth="xl" sx={{ height: '100%' }}>
            {children}
          </Container>
        </Box>
      </Box>
      
      {isMobile && (
        <Paper 
          elevation={3} 
          sx={{ 
            position: 'fixed', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            zIndex: 1100,
            borderRadius: '12px 12px 0 0',
          }}
        >
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-around', 
              p: 1 
            }}
          >
            {navItems.map((item) => (
              <Box 
                key={item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  p: 1,
                  color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
                  cursor: 'pointer',
                  '&:hover': {
                    color: 'primary.main',
                  }
                }}
              >
                {item.icon}
                <Typography variant="caption" sx={{ mt: 0.5 }}>
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default Layout;