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
  Grid,
  Chip,
  SelectChangeEvent,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { NumericFormat } from 'react-number-format';

interface Category {
  id: number;
  name: string;
  type: 'source' | 'block' | 'group' | 'action';
  parentId: number | null;
  children?: Category[];
}

interface Expense {
  id: number;
  description: string;
  value: number;
  categoryId: number;
  date: string;
  userId: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  observation: string;
  category?: {
    id: number;
    name: string;
    type: string;
    parentId: number | null;
  };
}

const Expenses: React.FC = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    description: '',
    value: '',
    categoryId: null as number | null,
    date: new Date().toISOString().split('T')[0],
    observation: '',
    status: 'pending' as 'pending' | 'confirmed' | 'cancelled',
  });

  // Estados para as categorias
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedSource, setSelectedSource] = useState<number | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<number | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [selectedAction, setSelectedAction] = useState<number | null>(null);

  // Estados para as opções de categorias
  const [sources, setSources] = useState<Category[]>([]);
  const [blocks, setBlocks] = useState<Category[]>([]);
  const [groups, setGroups] = useState<Category[]>([]);
  const [actions, setActions] = useState<Category[]>([]);

  useEffect(() => {
    loadExpenses();
    loadCategories();
  }, []);

  const loadExpenses = async () => {
    try {
      const response = await api.get('/expenses');
      setExpenses(response.data);
    } catch (error) {
      console.error('Erro ao carregar despesas:', error);
      setError('Erro ao carregar despesas');
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
      setSources(response.data);

      // Extrair blocos, grupos e ações
      const allBlocks: Category[] = [];
      const allGroups: Category[] = [];
      const allActions: Category[] = [];

      response.data.forEach((source: Category) => {
        if (source.children) {
          source.children.forEach((block: Category) => {
            allBlocks.push(block);
            if (block.children) {
              block.children.forEach((group: Category) => {
                allGroups.push(group);
                if (group.children) {
                  group.children.forEach((action: Category) => {
                    allActions.push(action);
                  });
                }
              });
            }
          });
        }
      });

      setBlocks(allBlocks);
      setGroups(allGroups);
      setActions(allActions);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      setError('Erro ao carregar categorias');
    }
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
    setError('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedExpense(null);
    setFormData({
      description: '',
      value: '',
      categoryId: null,
      date: new Date().toISOString().split('T')[0],
      observation: '',
      status: 'pending',
    });
    setSelectedSource(null);
    setSelectedBlock(null);
    setSelectedGroup(null);
    setSelectedAction(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const numericValue = parseFloat(
        formData.value
          .replace('R$ ', '')
          .replace(/\./g, '')
          .replace(',', '.')
      );

      if (isNaN(numericValue)) {
        setError('Valor inválido');
        return;
      }
      
      if (!selectedAction) {
        setError('Selecione uma categoria (ação)');
        return;
      }

      const data = {
        ...formData,
        value: numericValue,
        categoryId: selectedAction,
        userId: user?.id,
      };

      if (selectedExpense) {
        await api.put(`/expenses/${selectedExpense.id}`, data);
      } else {
        await api.post('/expenses', data);
      }

      handleCloseDialog();
      loadExpenses();
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
      setError('Erro ao salvar despesa');
    }
  };

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    const formattedValue = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(expense.value);

    setFormData({
      description: expense.description,
      value: formattedValue,
      categoryId: expense.categoryId,
      date: expense.date.split('T')[0],
      observation: expense.observation || '',
      status: expense.status,
    });
    
    // Encontrar e selecionar a hierarquia completa da categoria
    const findCategoryHierarchy = (categoryId: number) => {
      const action = actions.find(a => a.id === categoryId);
      if (action) {
        const group = groups.find(g => g.id === action.parentId);
        if (group) {
          const block = blocks.find(b => b.id === group.parentId);
          if (block) {
            const source = sources.find(s => s.id === block.parentId);
            if (source) {
              setSelectedSource(source.id);
              setSelectedBlock(block.id);
              setSelectedGroup(group.id);
              setSelectedAction(action.id);
            }
          }
        }
      }
    };

    findCategoryHierarchy(expense.categoryId);
    handleOpenDialog();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta despesa?')) {
      try {
        await api.delete(`/expenses/${id}`);
        loadExpenses();
      } catch (error) {
        console.error('Erro ao excluir despesa:', error);
        setError('Erro ao excluir despesa');
      }
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNumericChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      value: value,
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const columns: GridColDef[] = [
    {
      field: 'description',
      headerName: 'Descrição',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'value',
      headerName: 'Valor',
      flex: 1,
      minWidth: 150,
      valueFormatter: (params) => {
        const value = Number(params.value);
        if (isNaN(value)) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(value);
      },
    },
    {
      field: 'category',
      headerName: 'Categoria',
      flex: 1,
      minWidth: 200,
      valueGetter: (params) => {
        const expense = params.row;
        const action = actions.find(a => a.id === expense.categoryId);
        if (action) {
          const group = groups.find(g => g.id === action.parentId);
          if (group) {
            const block = blocks.find(b => b.id === group.parentId);
            if (block) {
              const source = sources.find(s => s.id === block.parentId);
              if (source) {
                return `${source.name} > ${block.name} > ${group.name} > ${action.name}`;
              }
            }
          }
        }
        return '';
      },
    },
    {
      field: 'date',
      headerName: 'Data',
      flex: 1,
      minWidth: 120,
      valueFormatter: (params) => {
        return new Date(params.value).toLocaleDateString('pt-BR');
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => {
        const statusColors = {
          pending: '#FFA726',    // Laranja
          confirmed: '#66BB6A',  // Verde
          cancelled: '#EF5350'   // Vermelho
        };
        const statusLabels = {
          pending: 'Pendente',
          confirmed: 'Confirmada',
          cancelled: 'Cancelada'
        };
        return (
          <Chip
            label={statusLabels[params.value as keyof typeof statusLabels]}
            sx={{
              bgcolor: statusColors[params.value as keyof typeof statusColors],
              color: 'white',
              '& .MuiChip-label': {
                fontWeight: 500
              }
            }}
          />
        );
      }
    },
    {
      field: 'observation',
      headerName: 'Observação',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'actions',
      headerName: 'Ações',
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleEdit(params.row)}
            disabled={user?.accessLevel !== 'admin'}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDelete(params.row.id)}
            disabled={user?.accessLevel !== 'admin'}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ height: 'calc(100vh - 180px)', width: '100%' }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Despesas</Typography>
          <Button
            variant="contained"
            onClick={handleOpenDialog}
            disabled={user?.accessLevel !== 'admin'}
          >
            Nova Despesa
          </Button>
        </Box>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box sx={{ height: 'calc(100vh - 280px)', width: '100%' }}>
          <DataGrid
            rows={expenses}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10, page: 0 },
              },
            }}
            pageSizeOptions={[10]}
            disableRowSelectionOnClick
          />
        </Box>
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedExpense ? 'Editar Despesa' : 'Nova Despesa'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Descrição"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <NumericFormat
                  customInput={TextField}
                  label="Valor"
                  fullWidth
                  value={formData.value}
                  onValueChange={(values) => {
                    handleNumericChange(values.formattedValue);
                  }}
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="R$ "
                  decimalScale={2}
                  fixedDecimalScale
                  required
                  allowNegative={false}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Data"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleSelectChange}
                    label="Status"
                    required
                  >
                    <MenuItem value="pending">Pendente</MenuItem>
                    <MenuItem value="confirmed">Confirmada</MenuItem>
                    <MenuItem value="cancelled">Cancelada</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Fonte</InputLabel>
                  <Select
                    value={selectedSource || ''}
                    onChange={(e) => {
                      const sourceId = e.target.value as number;
                      setSelectedSource(sourceId);
                      setSelectedBlock(null);
                      setSelectedGroup(null);
                      setSelectedAction(null);
                    }}
                    label="Fonte"
                    required
                  >
                    {sources.map((source) => (
                      <MenuItem key={source.id} value={source.id}>
                        {source.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {selectedSource && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Bloco</InputLabel>
                    <Select
                      value={selectedBlock || ''}
                      onChange={(e) => {
                        const blockId = e.target.value as number;
                        setSelectedBlock(blockId);
                        setSelectedGroup(null);
                        setSelectedAction(null);
                      }}
                      label="Bloco"
                      required
                    >
                      {blocks
                        .filter((block) => block.parentId === selectedSource)
                        .map((block) => (
                          <MenuItem key={block.id} value={block.id}>
                            {block.name}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              {selectedBlock && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Grupo</InputLabel>
                    <Select
                      value={selectedGroup || ''}
                      onChange={(e) => {
                        const groupId = e.target.value as number;
                        setSelectedGroup(groupId);
                        setSelectedAction(null);
                      }}
                      label="Grupo"
                      required
                    >
                      {groups
                        .filter((group) => group.parentId === selectedBlock)
                        .map((group) => (
                          <MenuItem key={group.id} value={group.id}>
                            {group.name}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              {selectedGroup && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Ação</InputLabel>
                    <Select
                      value={selectedAction || ''}
                      onChange={(e) => {
                        const actionId = e.target.value as number;
                        setSelectedAction(actionId);
                      }}
                      label="Ação"
                      required
                    >
                      {actions
                        .filter((action) => action.parentId === selectedGroup)
                        .map((action) => (
                          <MenuItem key={action.id} value={action.id}>
                            {action.name}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField
                  label="Observação"
                  name="observation"
                  fullWidth
                  multiline
                  rows={4}
                  value={formData.observation}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button type="submit" variant="contained">
              {selectedExpense ? 'Salvar' : 'Criar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Expenses;
