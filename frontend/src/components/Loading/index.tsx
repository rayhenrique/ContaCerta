import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const Loading: React.FC = () => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100vh"
      gap={2}
    >
      <CircularProgress size={40} color="primary" />
      <Typography variant="h6" color="textSecondary">
        Carregando...
      </Typography>
    </Box>
  );
};

export default Loading;
