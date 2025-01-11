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
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { User } from '../types/user';

interface Category {
  id: number;
  name: string;
  type: 'source' | 'block' | 'group' | 'action';
  parentId: number | null;
  children?: Category[];
  sourceName?: string;
  blockName?: string;
  groupName?: string;
}

interface FlatCategory extends Omit<Category, 'children'> {
  sourceName: string;
  blockName: string;
  groupName: string;
}

const Categories: React.FC = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [flatCategories, setFlatCategories] = useState<FlatCategory[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    source: { name: '', id: null as number | null },
    block: { name: '', id: null as number | null },
    group: { name: '', id: null as number | null },
    action: { name: '', id: null as number | null },
  });
  const [error, setError] = useState('');
  const [existingSources, setExistingSources] = useState<Category[]>([]);
  const [existingBlocks, setExistingBlocks] = useState<Category[]>([]);
  const [existingGroups, setExistingGroups] = useState<Category[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
      
      // Separar as categorias por tipo
      const sources = response.data;
      const blocks: Category[] = [];
      const groups: Category[] = [];
      const flatCats: FlatCategory[] = [];
      
      sources.forEach((source: Category) => {
        if (source.children) {
          source.children.forEach((block: Category) => {
            blocks.push(block);
            if (block.children) {
              block.children.forEach((group: Category) => {
                groups.push(group);
                if (group.children) {
                  group.children.forEach((action: Category) => {
                    flatCats.push({
                      ...action,
                      sourceName: source.name,
                      blockName: block.name,
                      groupName: group.name,
                    });
                  });
                }
              });
            }
          });
        }
      });
      
      setExistingSources(sources);
      setExistingBlocks(blocks);
      setExistingGroups(groups);
      setFlatCategories(flatCats);
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
    setSelectedCategory(null);
    setFormData({
      source: { name: '', id: null },
      block: { name: '', id: null },
      group: { name: '', id: null },
      action: { name: '', id: null },
    });
    setError('');
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    // Implementar lógica de edição
    handleOpenDialog();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      try {
        await api.delete(`/categories/${id}`);
        loadCategories();
      } catch (error) {
        console.error('Erro ao excluir categoria:', error);
        setError('Erro ao excluir categoria');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Criar fonte
      let sourceId = formData.source.id;
      if (formData.source.name && !sourceId) {
        const sourceResponse = await api.post('/categories', {
          name: formData.source.name,
          type: 'source',
        });
        sourceId = sourceResponse.data.id;
      }

      // Criar bloco
      let blockId = formData.block.id;
      if (formData.block.name && sourceId && !blockId) {
        const blockResponse = await api.post('/categories', {
          name: formData.block.name,
          type: 'block',
          parentId: sourceId,
        });
        blockId = blockResponse.data.id;
      }

      // Criar grupo
      let groupId = formData.group.id;
      if (formData.group.name && blockId && !groupId) {
        const groupResponse = await api.post('/categories', {
          name: formData.group.name,
          type: 'group',
          parentId: blockId,
        });
        groupId = groupResponse.data.id;
      }

      // Criar ação
      if (formData.action.name && groupId && !formData.action.id) {
        await api.post('/categories', {
          name: formData.action.name,
          type: 'action',
          parentId: groupId,
        });
      }

      handleCloseDialog();
      loadCategories();
    } catch (error) {
      console.error('Erro ao salvar categorias:', error);
      setError('Erro ao salvar categorias');
    }
  };

  const columns: GridColDef[] = [
    { 
      field: 'sourceName', 
      headerName: 'Fonte', 
      flex: 1,
      minWidth: 150 
    },
    { 
      field: 'blockName', 
      headerName: 'Bloco', 
      flex: 1,
      minWidth: 150 
    },
    { 
      field: 'groupName', 
      headerName: 'Grupo', 
      flex: 1,
      minWidth: 150 
    },
    { 
      field: 'name', 
      headerName: 'Ação', 
      flex: 1,
      minWidth: 150 
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
          <Typography variant="h6">Categorias</Typography>
          <Button
            variant="contained"
            onClick={handleOpenDialog}
            disabled={user?.accessLevel !== 'admin'}
          >
            Nova Categoria
          </Button>
        </Box>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box sx={{ height: 'calc(100vh - 280px)', width: '100%' }}>
          <DataGrid
            rows={flatCategories}
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
          {selectedCategory ? 'Editar Categoria' : 'Nova Categoria'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Fonte</InputLabel>
                  <Select
                    value={formData.source.id || ''}
                    onChange={(e) => {
                      const selectedId = e.target.value as number;
                      const selectedSource = existingSources.find(s => s.id === selectedId);
                      setFormData({
                        ...formData,
                        source: { 
                          id: selectedId, 
                          name: selectedSource ? selectedSource.name : ''
                        },
                        block: { name: '', id: null },
                        group: { name: '', id: null },
                        action: { name: '', id: null },
                      });
                    }}
                    label="Fonte"
                  >
                    <MenuItem value="">
                      <em>Nova Fonte</em>
                    </MenuItem>
                    {existingSources.map((source) => (
                      <MenuItem key={source.id} value={source.id}>
                        {source.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {!formData.source.id && (
                  <TextField
                    sx={{ mt: 2 }}
                    label="Nome da Nova Fonte"
                    fullWidth
                    value={formData.source.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        source: { ...formData.source, name: e.target.value },
                      })
                    }
                    required
                  />
                )}
              </Grid>
              
              {(formData.source.id || formData.source.name) && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Bloco</InputLabel>
                    <Select
                      value={formData.block.id || ''}
                      onChange={(e) => {
                        const selectedId = e.target.value as number;
                        const selectedBlock = existingBlocks.find(b => b.id === selectedId);
                        setFormData({
                          ...formData,
                          block: { 
                            id: selectedId, 
                            name: selectedBlock ? selectedBlock.name : ''
                          },
                          group: { name: '', id: null },
                          action: { name: '', id: null },
                        });
                      }}
                      label="Bloco"
                    >
                      <MenuItem value="">
                        <em>Novo Bloco</em>
                      </MenuItem>
                      {existingBlocks
                        .filter(block => block.parentId === formData.source.id)
                        .map((block) => (
                          <MenuItem key={block.id} value={block.id}>
                            {block.name}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                  {!formData.block.id && (
                    <TextField
                      sx={{ mt: 2 }}
                      label="Nome do Novo Bloco"
                      fullWidth
                      value={formData.block.name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          block: { ...formData.block, name: e.target.value },
                        })
                      }
                      required
                    />
                  )}
                </Grid>
              )}
              
              {((formData.block.id || formData.block.name) && (formData.source.id || formData.source.name)) && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Grupo</InputLabel>
                    <Select
                      value={formData.group.id || ''}
                      onChange={(e) => {
                        const selectedId = e.target.value as number;
                        const selectedGroup = existingGroups.find(g => g.id === selectedId);
                        setFormData({
                          ...formData,
                          group: { 
                            id: selectedId, 
                            name: selectedGroup ? selectedGroup.name : ''
                          },
                          action: { name: '', id: null },
                        });
                      }}
                      label="Grupo"
                    >
                      <MenuItem value="">
                        <em>Novo Grupo</em>
                      </MenuItem>
                      {existingGroups
                        .filter(group => group.parentId === formData.block.id)
                        .map((group) => (
                          <MenuItem key={group.id} value={group.id}>
                            {group.name}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                  {!formData.group.id && (
                    <TextField
                      sx={{ mt: 2 }}
                      label="Nome do Novo Grupo"
                      fullWidth
                      value={formData.group.name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          group: { ...formData.group, name: e.target.value },
                        })
                      }
                      required
                    />
                  )}
                </Grid>
              )}
              
              {((formData.group.id || formData.group.name) && 
                (formData.block.id || formData.block.name) && 
                (formData.source.id || formData.source.name)) && (
                <Grid item xs={12}>
                  <TextField
                    label="Nome da Ação"
                    fullWidth
                    value={formData.action.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        action: { ...formData.action, name: e.target.value },
                      })
                    }
                    required
                  />
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button type="submit" variant="contained">
              Salvar
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Categories;
