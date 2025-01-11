import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Profile: React.FC = () => {
  const { user, signOut } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (newPassword && newPassword !== confirmPassword) {
        setError('As senhas não conferem');
        return;
      }

      const data: any = {
        name,
        email,
      };

      if (newPassword) {
        data.currentPassword = currentPassword;
        data.newPassword = newPassword;
      }

      await api.put('/users/profile', data);
      setSuccess('Perfil atualizado com sucesso!');

      // Se a senha foi alterada, fazer logout
      if (newPassword) {
        setTimeout(() => {
          signOut();
        }, 2000);
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erro ao atualizar perfil');
    }
  };

  return (
    <Box sx={{ height: 'calc(100vh - 180px)', width: '100%', overflow: 'auto' }}>
      <Paper sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
        <Typography variant="h5" gutterBottom>
          Meu Perfil
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="E-mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Alterar Senha
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Senha Atual"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nova Senha"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Confirmar Nova Senha"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                sx={{ mt: 2 }}
              >
                Salvar Alterações
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default Profile;
