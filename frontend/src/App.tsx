import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ptBR } from '@mui/material/locale';
import { ptBR as dataGridPtBR } from '@mui/x-data-grid';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR as dateFnsPtBR } from 'date-fns/locale';
import { AuthProvider } from './contexts/AuthContext';
import AppRoutes from './routes';
import './App.css';

const theme = createTheme(
  {
    palette: {
      primary: {
        main: '#1976d2',
      },
    },
  },
  ptBR, // Tradução do Material-UI
  dataGridPtBR // Tradução do DataGrid
);

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={dateFnsPtBR}>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default App;
