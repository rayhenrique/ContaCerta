import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Layout from '../components/Layout';
import Dashboard from '../pages/Dashboard';
import Users from '../pages/Users';
import Categories from '../pages/Categories';
import Revenues from '../pages/Revenues';
import Expenses from '../pages/Expenses';
import Reports from '../pages/Reports';
import Profile from '../pages/Profile';
import { useAuth } from '../contexts/AuthContext';

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  console.log('AppRoutes: Estado de autenticação:', { user, loading });

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <Routes>
      {!user ? (
        <>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      ) : (
        <>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="categories" element={<Categories />} />
            <Route path="users" element={<Users />} />
            <Route path="revenues" element={<Revenues />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="reports" element={<Reports />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}
    </Routes>
  );
};

export default AppRoutes;
