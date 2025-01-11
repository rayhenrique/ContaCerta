import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';

// Registrar todos os componentes necessários do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,  // Adicionando o plugin Filler
  Title,
  Tooltip,
  Legend
);

// Configurações padrão para todos os gráficos
ChartJS.defaults.font.family = '"Roboto", "Helvetica", "Arial", sans-serif';
ChartJS.defaults.color = '#666';
ChartJS.defaults.responsive = true;

// Configurações específicas para gráficos de linha
export const lineChartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: true,
      text: 'Evolução Financeira',
    },
  },
  scales: {
    y: {
      beginAtZero: true,
    },
  },
};

// Configurações específicas para gráficos de barra
export const barChartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: true,
      text: 'Análise por Categoria',
    },
  },
  scales: {
    y: {
      beginAtZero: true,
    },
  },
};

// Configurações específicas para gráficos de pizza
export const pieChartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: true,
      text: 'Distribuição',
    },
  },
};
