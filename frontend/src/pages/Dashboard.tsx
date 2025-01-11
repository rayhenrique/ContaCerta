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
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import api from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardData {
  totalRevenue: number;
  totalExpenses: number;
  balance: number;
  recentTransactions: Transaction[];
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
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
      {
        label: 'Despesas',
        data: dashboardData.chartData?.datasets[1]?.data || [],
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Receitas x Despesas',
      },
    },
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={3}>
        {/* Cards de resumo */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AttachMoney color="primary" sx={{ fontSize: 40 }} />
              <Typography variant="h6">Receitas</Typography>
              <Typography variant="h4">
                R$ {Number(dashboardData.totalRevenue).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <MoneyOff color="error" sx={{ fontSize: 40 }} />
              <Typography variant="h6">Despesas</Typography>
              <Typography variant="h4">
                R$ {Number(dashboardData.totalExpenses).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AccountBalance color="success" sx={{ fontSize: 40 }} />
              <Typography variant="h6">Saldo</Typography>
              <Typography variant="h4">
                R$ {Number(dashboardData.balance).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUp color="info" sx={{ fontSize: 40 }} />
              <Typography variant="h6">Projeção Mensal</Typography>
              <Typography variant="h4">
                R$ {(Number(dashboardData.balance) * 1.1).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Gráfico */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Line options={chartOptions} data={chartData} />
          </Paper>
        </Grid>

        {/* Transações Recentes */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Transações Recentes
            </Typography>
            {dashboardData.recentTransactions.map((transaction, index) => (
              <Box
                key={`${transaction.id}-${transaction.type}-${index}`}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 1,
                  borderBottom: '1px solid #eee',
                }}
              >
                <Box>
                  <Typography variant="subtitle1">
                    {transaction.description}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(transaction.date).toLocaleDateString()}
                  </Typography>
                </Box>
                <Typography
                  variant="subtitle1"
                  color={transaction.type === 'revenue' ? 'success.main' : 'error.main'}
                >
                  R$ {Number(transaction.value).toFixed(2)}
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
