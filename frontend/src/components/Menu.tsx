import React from 'react';
import { Link } from 'react-router-dom';
import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  AttachMoney as RevenueIcon,
  MoneyOff as ExpenseIcon,
  Category as CategoryIcon,
  People as UserIcon,
  Assessment as ReportIcon,
  Help as HelpIcon,
  Person as ProfileIcon,
  Label as ClassificationIcon,
} from '@mui/icons-material';

export default function Menu() {
  return (
    <List component="nav">
      <ListItemButton component={Link} to="/dashboard">
        <ListItemIcon>
          <DashboardIcon />
        </ListItemIcon>
        <ListItemText primary="Dashboard" />
      </ListItemButton>

      <ListItemButton component={Link} to="/revenues">
        <ListItemIcon>
          <RevenueIcon />
        </ListItemIcon>
        <ListItemText primary="Receitas" />
      </ListItemButton>

      <ListItemButton component={Link} to="/expenses">
        <ListItemIcon>
          <ExpenseIcon />
        </ListItemIcon>
        <ListItemText primary="Despesas" />
      </ListItemButton>

      <ListItemButton component={Link} to="/expense-classifications">
        <ListItemIcon>
          <ClassificationIcon />
        </ListItemIcon>
        <ListItemText primary="Classificações" />
      </ListItemButton>

      <ListItemButton component={Link} to="/categories">
        <ListItemIcon>
          <CategoryIcon />
        </ListItemIcon>
        <ListItemText primary="Categorias" />
      </ListItemButton>

      <ListItemButton component={Link} to="/reports">
        <ListItemIcon>
          <ReportIcon />
        </ListItemIcon>
        <ListItemText primary="Relatórios" />
      </ListItemButton>

      <ListItemButton component={Link} to="/users">
        <ListItemIcon>
          <UserIcon />
        </ListItemIcon>
        <ListItemText primary="Usuários" />
      </ListItemButton>

      <Divider sx={{ my: 1 }} />

      <ListItemButton component={Link} to="/profile">
        <ListItemIcon>
          <ProfileIcon />
        </ListItemIcon>
        <ListItemText primary="Meu Perfil" />
      </ListItemButton>

      <ListItemButton component={Link} to="/manual">
        <ListItemIcon>
          <HelpIcon />
        </ListItemIcon>
        <ListItemText primary="Manual" />
      </ListItemButton>
    </List>
  );
} 