import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';

import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import UsersDashboard from './pages/users/UsersDashboard';
import RolesDashboard from './pages/roles/RolesDashboard';

// Placeholder views for non-configured modules
const EmployeesDashboard = () => <div className="p-4 font-semibold text-zinc-700">Employees Directory (Coming Soon)</div>;

import ProtectedRoute from './components/ProtectedRoute';
import { setCredentials, logOut, setLoading } from './store/authSlice';
import ProfileSettings from './pages/profile/ProfileSettings';

export default function App() {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await axios.post(
          'http://localhost:5001/api/auth/refresh',
          {},
          { withCredentials: true }
        );

        const { accessToken } = res.data;

        const profileRes = await axios.get('http://localhost:5001/api/users/profile', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        dispatch(setCredentials({
          user: profileRes.data,
          accessToken
        }));
      } catch (err) {
        dispatch(logOut());
      } finally {
        dispatch(setLoading(false));
      }
    };

    restoreSession();
  }, [dispatch]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50">
        <p className="text-gray-500 font-medium">Loading session...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Public Sign In Route */}
        <Route path="/login" element={<Login />} />

        {/* 2. Nested Dashboard Workspace Route */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* Default Child: renders on exactly /dashboard */}
          <Route index element={<DashboardHome />} />
          
          {/* Navigated Children: render inside the Dashboard Layout */}
          <Route path="users" element={<UsersDashboard />} />
          <Route path="roles" element={<RolesDashboard />} />
          <Route path="employees" element={<EmployeesDashboard />} />
           <Route path="profile" element={<ProfileSettings />} /> 
        </Route>

        {/* 3. Fallback Navigation Redirection */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}