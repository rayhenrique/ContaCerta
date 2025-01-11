import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Alert,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import type { User } from '../contexts/AuthContext';

const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    accessLevel: 'operator' as 'admin' | 'operator',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setError('Erro ao carregar usuários');
    }
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
    setError('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      accessLevel: 'operator',
    });
    setError('');
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      accessLevel: user.accessLevel,
    });
    handleOpenDialog();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        await api.delete(`/users/${id}`);
        loadUsers();
      } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        setError('Erro ao excluir usuário');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedUser) {
        // Editar usuário existente
        const data: Partial<typeof formData> = {
          name: formData.name,
          email: formData.email,
          accessLevel: formData.accessLevel,
        };
        if (formData.password) {
          data.password = formData.password;
        }
        await api.put(`/users/${selectedUser.id}`, data);
      } else {
        // Criar novo usuário
        await api.post('/users', formData);
      }
      handleCloseDialog();
      loadUsers();
    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error);
      setError(error.response?.data?.message || 'Erro ao salvar usuário');
    }
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Nome', flex: 1 },
    { field: 'email', headerName: 'Email', flex: 1 },
    { field: 'accessLevel', headerName: 'Nível de Acesso', flex: 1 },
    {
      field: 'actions',
      headerName: 'Ações',
      width: 120,
      renderCell: (params) => (
        <Box>
          <IconButton
            color="primary"
            onClick={() => handleEdit(params.row)}
            disabled={currentUser?.accessLevel !== 'admin'}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => handleDelete(params.row.id)}
            disabled={currentUser?.accessLevel !== 'admin'}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ height: 'calc(100vh - 180px)', width: '100%' }}>
      <Paper sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Usuários</Typography>
        <Button
          variant="contained"
          onClick={handleOpenDialog}
          disabled={currentUser?.accessLevel !== 'admin'}
        >
          Novo Usuário
        </Button>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <DataGrid
        rows={users}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 10, page: 0 },
          },
        }}
        pageSizeOptions={[10]}
        disableRowSelectionOnClick
      />

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{selectedUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Nome"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Senha"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!selectedUser}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth>
              <InputLabel>Nível de Acesso</InputLabel>
              <Select
                value={formData.accessLevel}
                onChange={(e) => setFormData({ ...formData, accessLevel: e.target.value as 'admin' | 'operator' })}
                label="Nível de Acesso"
              >
                <MenuItem value="operator">Operador</MenuItem>
                <MenuItem value="admin">Administrador</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;
