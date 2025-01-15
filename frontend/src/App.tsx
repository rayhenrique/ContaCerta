import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';
import { AuthProvider } from './contexts/AuthContext';
import theme from './theme';
import Routes from './routes';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <SnackbarProvider maxSnack={3}>
          <AuthProvider>
            <CssBaseline />
            <Routes />
          </AuthProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
