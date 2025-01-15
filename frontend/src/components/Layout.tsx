import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Avatar,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountBalanceWallet,
  AttachMoney,
  MoneyOff,
  Category,
  People,
  Assessment,
  AccountCircle,
  Logout,
  Person,
  Help,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    handleClose();
    navigate('/profile');
  };

  const handleLogout = () => {
    handleClose();
    signOut();
  };

  const menuItems = [
    { text: 'Dashboard', icon: <AccountBalanceWallet />, path: '/' },
    { text: 'Receitas', icon: <AttachMoney />, path: '/revenues' },
    { text: 'Despesas', icon: <MoneyOff />, path: '/expenses' },
    { text: 'Categorias', icon: <Category />, path: '/categories' },
    { text: 'Classificações de Despesas', icon: <Category />, path: '/expense-classifications' },
    { text: 'Usuários', icon: <People />, path: '/users' },
    { text: 'Relatórios', icon: <Assessment />, path: '/reports' },
    { text: 'Manual do Usuário', icon: <Help />, path: '/manual' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleDrawerOpen}
              edge="start"
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Box
              component="img"
              src="/logo.svg"
              alt="ContaCerta Logo"
              sx={{
                width: 32,
                height: 32,
                mr: 1,
              }}
            />
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                fontWeight: 600,
                color: 'white',
              }}
            >
              ContaCerta
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography
              variant="body1"
              sx={{
                mr: 1,
                color: 'white',
                opacity: 0.9,
              }}
            >
              {user?.name}
            </Typography>
            <IconButton
              size="small"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              sx={{
                ml: 1,
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                },
              }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'transparent',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                }}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={handleProfile}>
                <ListItemIcon>
                  <Person fontSize="small" />
                </ListItemIcon>
                <ListItemText>Perfil</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <Logout fontSize="small" />
                </ListItemIcon>
                <ListItemText>Sair</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="temporary"
        anchor="left"
        open={open}
        onClose={handleDrawerClose}
        sx={{
          width: 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
            background: '#FFFFFF',
            boxShadow: '0 0 20px rgba(0, 0, 0, 0.1)',
          },
        }}
      >
        <Box
          sx={{
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Box
            component="img"
            src="/logo.svg"
            alt="ContaCerta Logo"
            sx={{
              width: 32,
              height: 32,
            }}
          />
          <Typography
            variant="h6"
            sx={{
              color: 'white',
              fontWeight: 600,
            }}
          >
            ContaCerta
          </Typography>
        </Box>
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => (
              <ListItem 
                key={item.text} 
                button 
                onClick={() => {
                  navigate(item.path);
                  handleDrawerClose();
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - 240px)` },
          marginTop: '64px',
        }}
      >
        <Outlet />
      </Box>
      <Box
        component="footer"
        sx={{
          position: 'fixed',
          bottom: 0,
          width: '100%',
          bgcolor: '#FFFFFF',
          p: 1,
          textAlign: 'center',
          borderTop: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Copyright {' '}
          {new Date().getFullYear()} ContaCerta v1.0 | Desenvolvido por{' '}
          <a
            href="https://kltecnologia.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            KL Tecnologia
          </a>
        </Typography>
      </Box>
    </Box>
  );
};

export default Layout;
