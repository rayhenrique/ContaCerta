import { createTheme } from '@mui/material/styles';
import { ptBR } from '@mui/material/locale';
import { ptBR as dataGridPtBR } from '@mui/x-data-grid';

const theme = createTheme(
  {
    palette: {
      primary: {
        main: '#4F46E5',
      },
      secondary: {
        main: '#7C3AED',
      },
    },
  },
  ptBR,
  dataGridPtBR
);

export default theme;
