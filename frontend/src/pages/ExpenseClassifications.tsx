import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import api from '../services/api';

interface ExpenseClassification {
  id: number;
  name: string;
}

const ExpenseClassifications: React.FC = () => {
  const [classifications, setClassifications] = useState<ExpenseClassification[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [selectedClassification, setSelectedClassification] = useState<ExpenseClassification | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const loadClassifications = async () => {
    try {
      const response = await api.get('/expense-classifications');
      setClassifications(response.data);
    } catch (error) {
      enqueueSnackbar('Erro ao carregar classificações', { variant: 'error' });
    }
  };

  useEffect(() => {
    loadClassifications();
  }, []);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setName('');
    setSelectedClassification(null);
  };

  const handleEdit = (classification: ExpenseClassification) => {
    setSelectedClassification(classification);
    setName(classification.name);
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/expense-classifications/${id}`);
      enqueueSnackbar('Classificação excluída com sucesso', { variant: 'success' });
      loadClassifications();
    } catch (error) {
      enqueueSnackbar('Erro ao excluir classificação', { variant: 'error' });
    }
  };

  const handleSubmit = async () => {
    try {
      if (selectedClassification) {
        await api.put(`/expense-classifications/${selectedClassification.id}`, { name });
        enqueueSnackbar('Classificação atualizada com sucesso', { variant: 'success' });
      } else {
        await api.post('/expense-classifications', { name });
        enqueueSnackbar('Classificação criada com sucesso', { variant: 'success' });
      }
      handleClose();
      loadClassifications();
    } catch (error) {
      enqueueSnackbar('Erro ao salvar classificação', { variant: 'error' });
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Classificações de Despesas</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          Nova Classificação
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {classifications.map((classification) => (
              <TableRow key={classification.id}>
                <TableCell>{classification.name}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleEdit(classification)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(classification.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>
          {selectedClassification ? 'Editar Classificação' : 'Nova Classificação'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nome"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExpenseClassifications; 