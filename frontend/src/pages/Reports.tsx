import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent, // Add this import
  TextField,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { format } from 'date-fns';
import { lineChartOptions, barChartOptions, pieChartOptions } from '../config/chartConfig';
import api from '../services/api';
import axios from 'axios';

interface Category {
  id: number;
  name: string;
}

interface ExpenseClassification {
  id: number;
  name: string;
}

type ReportData = {
  labels: string[];
  revenues?: number[];
  expenses?: number[];
  revenuesByCategory?: Record<string, number>;
  expensesByCategory?: Record<string, number>;
  datasets?: {
    label: string;
    data: number[];
    backgroundColor?: string;
  }[];
};

const Reports: React.FC = () => {
  const [startDate, setStartDate] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [endDate, setEndDate] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
  );
  const [reportType, setReportType] = useState('monthly');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string>('');
  const [expenseClassifications, setExpenseClassifications] = useState<ExpenseClassification[]>([]);
  const [classificationId, setClassificationId] = useState<string>('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCategories();
    loadExpenseClassifications();
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      loadReportData();
    }
  }, [startDate, endDate, categoryId, classificationId, reportType]);

  useEffect(() => {
    setCategoryId('');
    setClassificationId('');
  }, [reportType]);

  useEffect(() => {
    console.log('Current Report Type:', reportType);
    console.log('Current Expense Classifications:', expenseClassifications);
  }, [reportType, expenseClassifications]);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      
      // Flatten nested categories
      const flattenCategories = (cats: any[], level = 0): Category[] => {
        return cats.reduce((acc: Category[], cat) => {
          const categoryWithLevel = {
            ...cat,
            name: level > 0 ? `${'—'.repeat(level)} ${cat.name}` : cat.name
          };
          
          if (cat.children && cat.children.length > 0) {
            return [
              ...acc, 
              categoryWithLevel, 
              ...flattenCategories(cat.children, level + 1)
            ];
          }
          
          return [...acc, categoryWithLevel];
        }, []);
      };

      const processedCategories = flattenCategories(response.data);
      setCategories(processedCategories);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      
      // More detailed error handling
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || 
                             'Não foi possível carregar as categorias. Tente novamente.';
        setError(errorMessage);
      } else {
        setError('Erro desconhecido ao carregar categorias');
      }
    }
  };

  const loadExpenseClassifications = async () => {
    try {
      console.log('Fetching expense classifications...');
      const response = await api.get('/expense-classifications');
      console.log('Expense Classifications Response:', response);
      
      if (response.data && response.data.length > 0) {
        console.log('Loaded Expense Classifications:', response.data);
        setExpenseClassifications(response.data);
      } else {
        console.warn('No expense classifications found');
        setExpenseClassifications([]);
      }
    } catch (error) {
      console.error('Erro ao carregar classificações de despesas:', error);
      
      // More detailed error logging
      if (axios.isAxiosError(error)) {
        console.error('Axios Error Details:', {
          response: error.response?.data,
          status: error.response?.status,
          headers: error.response?.headers
        });
      }
      
      // Set an empty array to prevent undefined errors
      setExpenseClassifications([]);
    }
  };

  // Map report types to backend types
  const REPORT_TYPE_MAP = {
    'monthly': 'revenues',
    'daily': 'expenses',
    'yearly': 'revenues' // You might want to adjust this based on your specific requirements
  };

  const loadReportData = async () => {
    try {
      const params: any = {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        type: REPORT_TYPE_MAP[reportType as keyof typeof REPORT_TYPE_MAP],
      };

      // Only add categoryId if it's defined and not empty
      if (categoryId && categoryId !== '') {
        params.categoryId = categoryId;
      }

      // Add classificationId for expenses or daily report
      if ((reportType === 'expenses' || reportType === 'daily') && 
          classificationId && classificationId !== '') {
        params.classificationId = classificationId;
      }

      console.log('Report Request Params:', JSON.stringify(params, null, 2));

      const response = await api.get('/reports', { params });
      console.log('Report Response:', response.data);

      // Process and set report data
      setReportData(response.data);
      setError('');
    } catch (error) {
      console.error('Erro ao carregar dados do relatório:', error);
      
      // More detailed error logging
      if (axios.isAxiosError(error)) {
        console.error('Axios Error Details:', {
          response: error.response?.data,
          status: error.response?.status,
          headers: error.response?.headers
        });
      }
      
      setError('Erro ao carregar dados do relatório');
      setReportData(null);
    }
  };

  const handleExportPDF = async () => {
    try {
      const params: any = {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        type: REPORT_TYPE_MAP[reportType as keyof typeof REPORT_TYPE_MAP],
      };

      // Only add categoryId if it's a non-empty string
      if (categoryId && categoryId !== '') {
        params.categoryId = categoryId;
      }

      // Add classificationId for expenses
      if (reportType === 'daily' && classificationId && classificationId !== '') {
        params.classificationId = classificationId;
      }

      console.log('PDF Export Params:', JSON.stringify(params, null, 2));

      const response = await api.get('/reports/export/pdf', {
        params,
        responseType: 'blob',
      });

      // Create a link to download the file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio_${reportType}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erro detalhado ao exportar PDF:', error);
      
      // More detailed error logging
      if (axios.isAxiosError(error)) {
        console.error('Axios Error Details:', {
          response: error.response?.data,
          status: error.response?.status,
          headers: error.response?.headers
        });
      }
      
      setError('Erro ao exportar relatório em PDF. Verifique os detalhes no console.');
    }
  };

  const handleExportExcel = async () => {
    try {
      const params: any = {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        type: REPORT_TYPE_MAP[reportType as keyof typeof REPORT_TYPE_MAP],
      };

      // Only add categoryId if it's a non-empty string
      if (categoryId && categoryId !== '') {
        params.categoryId = categoryId;
      }

      // Add classificationId for expenses
      if (reportType === 'daily' && classificationId && classificationId !== '') {
        params.classificationId = classificationId;
      }

      console.log('Excel Export Params:', JSON.stringify(params, null, 2));

      const response = await api.get('/reports/export/excel', {
        params,
        responseType: 'blob',
      });

      // Create a link to download the file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio_${reportType}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erro detalhado ao exportar Excel:', error);
      
      // More detailed error logging
      if (axios.isAxiosError(error)) {
        console.error('Axios Error Details:', {
          response: error.response?.data,
          status: error.response?.status,
          headers: error.response?.headers
        });
      }
      
      setError('Erro ao exportar relatório em Excel. Verifique os detalhes no console.');
    }
  };

  const handleCategoryChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    setCategoryId(value);
  };

  const handleClassificationChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    setClassificationId(value);
  };

  return (
    <Box sx={{ height: 'calc(100vh - 180px)', width: '100%', overflow: 'auto' }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Relatórios</Typography>
          <Box>
            <Button
              variant="contained"
              onClick={handleExportPDF}
              sx={{ mr: 1 }}
            >
              Exportar PDF
            </Button>
            <Button variant="contained" onClick={handleExportExcel}>
              Exportar Excel
            </Button>
          </Box>
        </Box>

        {error && (
          <Grid item xs={12}>
            <Alert severity="warning" sx={{ width: '100%' }}>
              {error}
            </Alert>
          </Grid>
        )}

        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Relatório</InputLabel>
              <Select
                value={reportType}
                label="Tipo de Relatório"
                onChange={(e) => setReportType(e.target.value)}
              >
                <MenuItem value="monthly">Mensal</MenuItem>
                <MenuItem value="daily">Diário</MenuItem>
                <MenuItem value="yearly">Anual</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
              <DatePicker
                label="Data Inicial"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue || new Date())}
                slotProps={{
                  textField: { fullWidth: true },
                }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={4}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
              <DatePicker
                label="Data Final"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue || new Date())}
                slotProps={{
                  textField: { fullWidth: true },
                }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Categoria</InputLabel>
              <Select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                label="Categoria"
              >
                <MenuItem value="">Todas</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {(reportType === 'daily' || reportType === 'expenses') && (
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Classificação de Despesa</InputLabel>
                <Select
                  value={classificationId}
                  label="Classificação de Despesa"
                  onChange={(e) => setClassificationId(e.target.value)}
                >
                  <MenuItem value="">Todas as Classificações</MenuItem>
                  {expenseClassifications.map((classification) => (
                    <MenuItem 
                      key={classification.id} 
                      value={classification.id.toString()}
                    >
                      {classification.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>

        {error && (
          <Grid item xs={12}>
            <Alert severity="warning" sx={{ width: '100%' }}>
              {error}
            </Alert>
          </Grid>
        )}

        {reportData && reportData.datasets && reportData.datasets[0].data.length > 0 ? (
          <>
            <Grid item xs={12} md={8}>
              <Paper 
                sx={{ 
                  p: 2, 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column' 
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Gráfico de {reportType === 'monthly' ? 'Receitas Mensais' : 'Despesas'}
                </Typography>
                <Box 
                  sx={{ 
                    flexGrow: 1, 
                    height: '400px', 
                    position: 'relative' 
                  }}
                >
                  <Line 
                    data={{
                      labels: reportData.labels,
                      datasets: reportData.datasets || []
                    }} 
                    options={{ 
                      responsive: true,
                      maintainAspectRatio: false,
                      layout: {
                        padding: {
                          top: 10,
                          bottom: 10,
                          left: 10,
                          right: 10
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function(value) {
                              return `R$ ${Number(value).toFixed(2)}`;
                            }
                          }
                        }
                      },
                      plugins: {
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              return `R$ ${context.parsed.y.toFixed(2)}`;
                            }
                          }
                        }
                      }
                    }} 
                  />
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Resumo
                </Typography>
                <Typography variant="body1">
                  Total: R$ {reportData.datasets?.[0].data.reduce((a: number, b: number) => a + b, 0).toFixed(2)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Baseado em {reportData.datasets?.[0].data.length} registro(s)
                </Typography>
              </Paper>
            </Grid>
          </>
        ) : (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" color="textSecondary">
                {error || 'Nenhum dado encontrado para o período selecionado'}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                Tente ajustar os filtros ou adicionar novos registros
              </Typography>
            </Paper>
          </Grid>
        )}
      </Paper>
    </Box>
  );
};

export default Reports;
