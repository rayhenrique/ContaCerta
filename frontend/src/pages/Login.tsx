import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  IconButton,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Fade,
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await signIn(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Email ou senha inválidos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
        margin: 0,
        padding: 0,
      }}
    >
      <Container maxWidth="xs">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            padding: 4,
            animation: 'fadeIn 0.3s ease-out',
            '@keyframes fadeIn': {
              from: {
                opacity: 0,
                transform: 'translateY(20px)',
              },
              to: {
                opacity: 1,
                transform: 'translateY(0)',
              },
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 3,
            }}
          >
            <Box
              component="img"
              src="/logo.svg"
              alt="ContaCerta Logo"
              sx={{
                width: 40,
                height: 40,
              }}
            />
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 700,
                color: '#4F46E5',
                fontSize: isMobile ? '1.5rem' : '2rem',
              }}
            >
              ContaCerta
            </Typography>
          </Box>

          <Typography
            variant="body1"
            sx={{
              mb: 4,
              color: 'text.secondary',
              textAlign: 'center',
            }}
          >
            Faça login para gerenciar suas finanças
          </Typography>

          {error && (
            <Fade in={true}>
              <Alert
                severity="error"
                sx={{
                  width: '100%',
                  mb: 2,
                }}
              >
                {error}
              </Alert>
            </Fade>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              width: '100%',
              '& .MuiTextField-root': {
                mb: 2,
              },
            }}
          >
            <TextField
              required
              fullWidth
              id="email"
              name="email"
              label="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: 'action.active' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(243, 244, 246, 0.8)',
                },
              }}
            />

            <TextField
              required
              fullWidth
              id="password"
              name="password"
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: 'action.active' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(243, 244, 246, 0.8)',
                },
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
              sx={{
                mt: 3,
                mb: 2,
                height: 48,
                backgroundColor: '#4F46E5',
                '&:hover': {
                  backgroundColor: '#4338CA',
                },
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Entrar'
              )}
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;
