import React, { useEffect, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
} from '@mui/material';
import {
  AttachMoney,
  MoneyOff,
  AccountBalance,
  TrendingUp,
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import { lineChartOptions } from '../config/chartConfig';
import api from '../services/api';

interface DashboardData {
  totalRevenue: number;
  totalExpenses: number;
  balance: number;
  recentTransactions: Transaction[];
  confirmedRevenues: number; // Receitas confirmadas para o próximo mês
  scheduledExpenses: number; // Despesas agendadas para o próximo mês
  averageVariableExpenses: number; // Média de despesas variáveis dos últimos 3 meses
  chartData: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
    }[];
  };
}

interface Transaction {
  id: number;
  description: string;
  value: number;
  date: string;
  type: 'revenue' | 'expense';
}

const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalRevenue: 0,
    totalExpenses: 0,
    balance: 0,
    confirmedRevenues: 0,
    scheduledExpenses: 0,
    averageVariableExpenses: 0,
    recentTransactions: [],
    chartData: {
      labels: [],
      datasets: [],
    },
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const response = await api.get('/dashboard');
        setDashboardData(response.data);
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      }
    };

    loadDashboardData();
  }, []);

  const chartData = {
    labels: dashboardData.chartData?.labels || [],
    datasets: [
      {
        label: 'Receitas',
        data: dashboardData.chartData?.datasets[0]?.data || [],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Despesas',
        data: dashboardData.chartData?.datasets[1]?.data || [],
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = lineChartOptions;

  const calculateConservativeProjection = () => {
    const SAFETY_MARGIN = 0.1; // 10% de margem de segurança

    // Receitas confirmadas para o próximo mês
    const projectedRevenue = dashboardData.confirmedRevenues;
    
    // Total de despesas previstas
    const projectedExpenses = 
      dashboardData.scheduledExpenses + // Despesas já agendadas
      dashboardData.averageVariableExpenses; // Média de despesas variáveis
    
    // Adiciona margem de segurança às despesas
    const expensesWithSafetyMargin = projectedExpenses * (1 + SAFETY_MARGIN);
    
    // Projeção final é receitas menos despesas com margem
    const projection = projectedRevenue - expensesWithSafetyMargin;
    
    return projection;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <Box sx={{ flexGrow: 1, maxWidth: 1200, margin: '0 auto' }}>
      <Grid container spacing={3}>
        {/* Cards de resumo */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              boxShadow: '0 4px 20px rgba(79, 70, 229, 0.1)',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-5px)',
              },
            }}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <AttachMoney sx={{ fontSize: 40, color: 'white' }} />
              <Typography variant="h6" sx={{ color: 'white', opacity: 0.9, mb: 1 }}>
                Receitas
              </Typography>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
                {formatCurrency(dashboardData.totalRevenue)}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  display: 'block', 
                  color: 'white', 
                  opacity: 0.8,
                  mt: 1,
                  fontSize: '0.7rem',
                }}
              >
                Total de receitas no mês atual
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
              boxShadow: '0 4px 20px rgba(239, 68, 68, 0.1)',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-5px)',
              },
            }}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <MoneyOff sx={{ fontSize: 40, color: 'white' }} />
              <Typography variant="h6" sx={{ color: 'white', opacity: 0.9, mb: 1 }}>
                Despesas
              </Typography>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
                {formatCurrency(dashboardData.totalExpenses)}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  display: 'block', 
                  color: 'white', 
                  opacity: 0.8,
                  mt: 1,
                  fontSize: '0.7rem',
                }}
              >
                Total de despesas no mês atual
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.1)',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-5px)',
              },
            }}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <AccountBalance sx={{ fontSize: 40, color: 'white' }} />
              <Typography variant="h6" sx={{ color: 'white', opacity: 0.9, mb: 1 }}>
                Saldo
              </Typography>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
                {formatCurrency(dashboardData.balance)}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  display: 'block', 
                  color: 'white', 
                  opacity: 0.8,
                  mt: 1,
                  fontSize: '0.7rem',
                }}
              >
                Receitas menos despesas do mês
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
              boxShadow: '0 4px 20px rgba(14, 165, 233, 0.1)',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-5px)',
              },
            }}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUp sx={{ fontSize: 40, color: 'white' }} />
              <Typography variant="h6" sx={{ color: 'white', opacity: 0.9, mb: 1 }}>
                Projeção Mensal
              </Typography>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
                {formatCurrency(calculateConservativeProjection())}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  display: 'block', 
                  color: 'white', 
                  opacity: 0.8,
                  mt: 1,
                  fontSize: '0.7rem',
                }}
              >
                Previsão de rec. e desp. futuras
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Gráfico */}
        <Grid item xs={12}>
          <Paper 
            sx={{ 
              p: 3,
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
              background: '#FFFFFF',
              height: 450,
            }}
          >
            <Typography 
              variant="h5" 
              sx={{ 
                mb: 3, 
                fontWeight: 600,
                color: '#1F2937',
              }}
            >
              Evolução Financeira
            </Typography>
            <Box sx={{ height: 350 }}>
              <Line options={chartOptions} data={chartData} />
            </Box>
          </Paper>
        </Grid>

        {/* Transações Recentes */}
        <Grid item xs={12}>
          <Paper 
            sx={{ 
              p: 3,
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
              background: '#FFFFFF',
            }}
          >
            <Typography 
              variant="h5" 
              sx={{ 
                mb: 3,
                fontWeight: 600,
                color: '#1F2937',
              }}
            >
              Transações Recentes
            </Typography>
            {dashboardData.recentTransactions.map((transaction, index) => (
              <Box
                key={`${transaction.id}-${transaction.type}-${index}`}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 2,
                  mb: 1,
                  borderRadius: 1,
                  backgroundColor: 'rgba(243, 244, 246, 0.5)',
                  transition: 'background-color 0.2s',
                  '&:hover': {
                    backgroundColor: 'rgba(243, 244, 246, 0.8)',
                  },
                }}
              >
                <Box>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontWeight: 500,
                      color: '#1F2937',
                    }}
                  >
                    {transaction.description}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(transaction.date).toLocaleDateString()}
                  </Typography>
                </Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    color: transaction.type === 'revenue' ? '#10B981' : '#EF4444',
                  }}
                >
                  {formatCurrency(transaction.value)}
                </Typography>
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
