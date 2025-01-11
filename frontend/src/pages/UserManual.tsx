import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  useTheme,
} from '@mui/material';

const UserManual: React.FC = () => {
  const theme = useTheme();

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom color="primary">
          Manual do Usuário - ContaCerta
        </Typography>

        <Typography variant="h5" sx={{ mt: 4, mb: 2 }} color="primary">
          1. Visão Geral
        </Typography>
        <Typography paragraph>
          O ContaCerta é um sistema de gestão financeira que permite controlar receitas e despesas,
          além de fornecer uma projeção mensal conservadora do seu fluxo de caixa.
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" sx={{ mt: 4, mb: 2 }} color="primary">
          2. Dashboard
        </Typography>
        <Typography paragraph>
          O dashboard apresenta uma visão geral das suas finanças:
        </Typography>
        <List>
          <ListItem>
            <ListItemText 
              primary="Projeção Mensal" 
              secondary="Cálculo conservador considerando apenas receitas confirmadas e todas as despesas previstas, com margem de segurança de 10%."
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Gráficos" 
              secondary="Visualização da distribuição de receitas e despesas ao longo do tempo."
            />
          </ListItem>
        </List>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" sx={{ mt: 4, mb: 2 }} color="primary">
          3. Gerenciando Receitas
        </Typography>
        <Typography paragraph>
          Na seção de receitas, você pode:
        </Typography>
        <List>
          <ListItem>
            <ListItemText 
              primary="Adicionar Receitas" 
              secondary="Clique no botão '+' e preencha os dados: descrição, valor, data e status (Pendente, Confirmada ou Cancelada)."
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Editar Receitas" 
              secondary="Clique no ícone de edição na linha da receita desejada."
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Excluir Receitas" 
              secondary="Clique no ícone de lixeira na linha da receita desejada."
            />
          </ListItem>
        </List>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" sx={{ mt: 4, mb: 2 }} color="primary">
          4. Gerenciando Despesas
        </Typography>
        <Typography paragraph>
          Na seção de despesas, você pode:
        </Typography>
        <List>
          <ListItem>
            <ListItemText 
              primary="Adicionar Despesas" 
              secondary="Clique no botão '+' e preencha os dados: descrição, valor, data e tipo (Fixa ou Variável)."
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Editar Despesas" 
              secondary="Clique no ícone de edição na linha da despesa desejada."
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Excluir Despesas" 
              secondary="Clique no ícone de lixeira na linha da despesa desejada."
            />
          </ListItem>
        </List>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" sx={{ mt: 4, mb: 2 }} color="primary">
          5. Dicas de Uso
        </Typography>
        <List>
          <ListItem>
            <ListItemText 
              primary="Status das Receitas" 
              secondary="Mantenha o status das receitas atualizado para uma projeção mais precisa."
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Tipos de Despesa" 
              secondary="Classifique corretamente as despesas entre fixas e variáveis para melhor controle."
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Observações" 
              secondary="Use o campo de observações para registrar informações importantes sobre cada transação."
            />
          </ListItem>
        </List>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" sx={{ mt: 4, mb: 2 }} color="primary">
          6. Suporte
        </Typography>
        <Typography paragraph>
          Em caso de dúvidas ou problemas, entre em contato com o suporte através do email: 
          <Box component="span" sx={{ color: theme.palette.primary.main }}>
            {' suporte@contacerta.com.br'}
          </Box>
        </Typography>
      </Paper>
    </Box>
  );
};

export default UserManual;
