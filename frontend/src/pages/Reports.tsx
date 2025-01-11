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

interface Category {
  id: number;
  name: string;
}

interface ReportData {
  labels: string[];
  revenues: number[];
  expenses: number[];
  revenuesByCategory: { [key: string]: number };
  expensesByCategory: { [key: string]: number };
}

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
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      loadReportData();
    }
  }, [startDate, endDate, categoryId, reportType]);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      const flattenCategories = (cats: any[]): Category[] => {
        return cats.reduce((acc: Category[], cat) => {
          if (cat.children) {
            return [...acc, cat, ...flattenCategories(cat.children)];
          }
          return [...acc, cat];
        }, []);
      };
      setCategories(flattenCategories(response.data));
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const loadReportData = async () => {
    try {
      const params = {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        categoryId: categoryId || undefined,
        type: reportType,
      };

      const response = await api.get('/reports', { params });
      setReportData(response.data);
    } catch (error) {
      console.error('Erro ao carregar dados do relatório:', error);
      setError('Erro ao carregar dados do relatório');
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await api.get('/reports/export/pdf', {
        params: {
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
          categoryId: categoryId || undefined,
          type: reportType,
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `relatorio_${format(startDate, 'dd-MM-yyyy')}_${format(
          endDate,
          'dd-MM-yyyy'
        )}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      setError('Erro ao exportar PDF');
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await api.get('/reports/export/excel', {
        params: {
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
          categoryId: categoryId || undefined,
          type: reportType,
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `relatorio_${format(startDate, 'dd-MM-yyyy')}_${format(
          endDate,
          'dd-MM-yyyy'
        )}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      setError('Erro ao exportar Excel');
    }
  };

  const lineChartData = reportData
    ? {
        labels: reportData.labels,
        datasets: [
          {
            label: 'Receitas',
            data: reportData.revenues,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
          },
          {
            label: 'Despesas',
            data: reportData.expenses,
            borderColor: 'rgb(255, 99, 132)',
            tension: 0.1,
          },
        ],
      }
    : null;

  const pieChartDataRevenues = reportData && reportData.revenuesByCategory
    ? {
        labels: Object.keys(reportData.revenuesByCategory),
        datasets: [
          {
            data: Object.values(reportData.revenuesByCategory),
            backgroundColor: [
              '#FF6384',
              '#36A2EB',
              '#FFCE56',
              '#4BC0C0',
              '#9966FF',
              '#FF9F40',
            ],
          },
        ],
      }
    : null;

  const pieChartDataExpenses = reportData && reportData.expensesByCategory
    ? {
        labels: Object.keys(reportData.expensesByCategory),
        datasets: [
          {
            data: Object.values(reportData.expensesByCategory),
            backgroundColor: [
              '#FF6384',
              '#36A2EB',
              '#FFCE56',
              '#4BC0C0',
              '#9966FF',
              '#FF9F40',
            ],
          },
        ],
      }
    : null;

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
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Relatório</InputLabel>
              <Select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                label="Tipo de Relatório"
              >
                <MenuItem value="daily">Diário</MenuItem>
                <MenuItem value="monthly">Mensal</MenuItem>
                <MenuItem value="yearly">Anual</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
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
          <Grid item xs={12} md={3}>
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
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Categoria</InputLabel>
              <Select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                label="Categoria"
              >
                <MenuItem value="">Todas</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {reportData && (
          <>
            <Grid container spacing={4}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Evolução de Receitas e Despesas
                </Typography>
                {lineChartData && <Line data={lineChartData} options={lineChartOptions} />}
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Receitas por Categoria
                </Typography>
                {pieChartDataRevenues && <Pie data={pieChartDataRevenues} options={pieChartOptions} />}
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Despesas por Categoria
                </Typography>
                {pieChartDataExpenses && <Pie data={pieChartDataExpenses} options={pieChartOptions} />}
              </Grid>
            </Grid>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default Reports;
