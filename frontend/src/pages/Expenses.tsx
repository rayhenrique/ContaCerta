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
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { canManageReceita } from '../utils/permissions';
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
  category?: {
    id: number;
    name: string;
    type: string;
    parentId: number | null;
  };
  observation: string;
  classificationId: number | null;
  classification?: {
    id: number;
    name: string;
  };
}

interface ExpenseClassification {
  id: number;
  name: string;
}

const Expenses: React.FC = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sources, setSources] = useState<Category[]>([]);
  const [blocks, setBlocks] = useState<Category[]>([]);
  const [groups, setGroups] = useState<Category[]>([]);
  const [actions, setActions] = useState<Category[]>([]);
  const [classifications, setClassifications] = useState<ExpenseClassification[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [error, setError] = useState('');
  const [selectedSource, setSelectedSource] = useState<number | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<number | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [selectedAction, setSelectedAction] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    value: '',  
    categoryId: null as number | null,
    date: new Date().toISOString().split('T')[0],
    classificationId: null as number | null,
    status: 'pending' as 'pending' | 'confirmed' | 'cancelled',
    observation: '',
  });

  useEffect(() => {
    loadExpenses();
    loadCategories();
    loadClassifications();
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
      setSources(response.data);

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

      console.log('Sources:', response.data);
      console.log('Blocks:', allBlocks);
      console.log('Groups:', allGroups);
      console.log('Actions:', allActions);

      setBlocks(allBlocks);
      setGroups(allGroups);
      setActions(allActions);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      setError('Erro ao carregar categorias');
    }
  };

  const loadClassifications = async () => {
    try {
      const response = await api.get('/expense-classifications');
      setClassifications(response.data);
    } catch (error) {
      console.error('Erro ao carregar classificações:', error);
      setError('Erro ao carregar classificações');
    }
  };

  const handleOpenDialog = () => {
    // Use local date without timezone adjustment
    const localDate = new Date();
    const formattedDate = `${localDate.getFullYear()}-${
      String(localDate.getMonth() + 1).padStart(2, '0')
    }-${String(localDate.getDate()).padStart(2, '0')}`;

    setOpenDialog(true);
    setError('');
    setFormData(prev => ({
      ...prev,
      date: formattedDate
    }));
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedExpense(null);
    setSelectedSource(null);
    setSelectedBlock(null);
    setSelectedGroup(null);
    setSelectedAction(null);
    setFormData({
      description: '',
      value: '',  
      categoryId: null,
      date: new Date().toISOString().split('T')[0],
      classificationId: null,
      status: 'pending',
      observation: '',
    });
  };

  const handleInputChange = (
    e: 
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> 
      | SelectChangeEvent<string | number | ("pending" | "confirmed" | "cancelled")>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

      // Ensure the date is in the correct format
      const inputDate = new Date(formData.date);
      const year = inputDate.getFullYear();
      const month = String(inputDate.getMonth() + 1).padStart(2, '0');
      const day = String(inputDate.getDate() + 1).padStart(2, '0');  // Add 1 to the day
      const formattedDate = `${year}-${month}-${day}`;

      console.log('Frontend - Original input date:', formData.date);
      console.log('Frontend - Input date object:', inputDate);
      console.log('Frontend - Formatted date:', formattedDate);

      const data = {
        ...formData,
        value: numericValue,
        categoryId: selectedAction,
        userId: user?.id,
        date: formattedDate  // Use explicitly formatted date
      };

      console.log('Frontend - Submission data:', data);

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

  const handleNumericChange = (value: string) => {
    console.log('Numeric change input:', value);
    
    // Directly set the formatted value
    const formattedValue = `R$ ${value}`.replace('.', ',');

    setFormData((prev) => ({
      ...prev,
      value: formattedValue,
    }));
  };

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    
    const formattedValue = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(expense.value);

    const formattedDate = format(new Date(expense.date), 'yyyy-MM-dd');

    setFormData({
      description: expense.description,
      value: formattedValue,
      categoryId: expense.categoryId,
      date: formattedDate,
      classificationId: expense.classificationId,
      observation: expense.observation || '',
      status: expense.status,
    });

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
    try {
      await api.delete(`/expenses/${id}`);
      loadExpenses();
    } catch (error) {
      console.error('Erro ao excluir despesa:', error);
      setError('Erro ao excluir despesa');
    }
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
      minWidth: 120,
      valueFormatter: (params) => {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(params.value);
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
      field: 'classification',
      headerName: 'Classificação',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => {
        const expense = params.row;
        const classification = classifications.find(c => c.id === expense.classificationId);
        return classification ? classification.name : '-';
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
          pending: '#FFA726',    
          confirmed: '#66BB6A',  
          cancelled: '#EF5350'   
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
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
            disabled={!canManageReceita(user)}
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
                  name="value"
                  value={formData.value.replace('R$ ', '').replace('.', ',')}
                  onValueChange={(values) => {
                    console.log('NumericFormat values:', values);
                    // Use the numeric value for parsing
                    handleNumericChange(values.value);
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
                    onChange={handleInputChange}
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
                    value={selectedSource?.toString() || ''}
                    onChange={(e) => {
                      const sourceId = Number(e.target.value);
                      setSelectedSource(sourceId);
                      setSelectedBlock(null);
                      setSelectedGroup(null);
                      setSelectedAction(null);
                    }}
                    label="Fonte"
                  >
                    {sources.map((source) => (
                      <MenuItem key={source.id} value={source.id.toString()}>
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
                      value={selectedBlock?.toString() || ''}
                      onChange={(e) => {
                        const blockId = Number(e.target.value);
                        setSelectedBlock(blockId);
                        setSelectedGroup(null);
                        setSelectedAction(null);
                      }}
                      label="Bloco"
                    >
                      {blocks
                        .filter((block) => block.parentId === selectedSource)
                        .map((block) => (
                          <MenuItem key={block.id} value={block.id.toString()}>
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
                      value={selectedGroup?.toString() || ''}
                      onChange={(e) => {
                        const groupId = Number(e.target.value);
                        setSelectedGroup(groupId);
                        setSelectedAction(null);
                      }}
                      label="Grupo"
                    >
                      {groups
                        .filter((group) => group.parentId === selectedBlock)
                        .map((group) => (
                          <MenuItem key={group.id} value={group.id.toString()}>
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
                      value={selectedAction?.toString() || ''}
                      onChange={(e) => {
                        const actionId = Number(e.target.value);
                        setSelectedAction(actionId);
                      }}
                      label="Ação"
                    >
                      {actions
                        .filter((action) => action.parentId === selectedGroup)
                        .map((action) => (
                          <MenuItem key={action.id} value={action.id.toString()}>
                            {action.name}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Classificação</InputLabel>
                  <Select
                    name="classificationId"
                    value={formData.classificationId?.toString() || ''}
                    onChange={handleInputChange}
                    label="Classificação"
                  >
                    {classifications.map((classification) => (
                      <MenuItem key={classification.id} value={classification.id.toString()}>
                        {classification.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  margin="dense"
                  label="Observação"
                  fullWidth
                  value={formData.observation}
                  onChange={handleInputChange}
                  name="observation"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} color="secondary">
              Cancelar
            </Button>
            <Button type="submit" color="primary" variant="contained">
              Salvar
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Expenses;
