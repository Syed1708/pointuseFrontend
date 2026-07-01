import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";

import Login from "./pages/Login";
import DashboardLayout from "./components/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import UsersDashboard from "./pages/users/UsersDashboard";
import RolesDashboard from "./pages/roles/RolesDashboard";

import ProtectedRoute from "./components/ProtectedRoute";
import { setCredentials, logOut, setLoading } from "./store/authSlice";
import ProfileSettings from "./pages/profile/ProfileSettings";
import EmployeesDashboard from "./pages/Employees/EmployeesDashboard";
import PlanningDashboard from "./pages/Planning/PlanningDashboard";
import NotFound from "./pages/NotFound";
import PlanningEmployee from "./pages/Planning/PlanningEmployee";
import socket from './services/socket'; // 🛑 Import socket service
import { useQueryClient } from "@tanstack/react-query";

export default function App() {
  const dispatch = useDispatch();
  const queryClient = useQueryClient(); // 🛑 Access TanStack Query engine [3]
  const { user, loading } = useSelector((state) => state.auth);

    // 1. Session Restoration on Mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await axios.post(
          "http://localhost:5001/api/auth/refresh",
          {},
          { withCredentials: true },
        );

        const { accessToken } = res.data;

        const profileRes = await axios.get(
          "http://localhost:5001/api/users/profile",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );

        dispatch(
          setCredentials({
            user: profileRes.data,
            accessToken,
          }),
        );
      } catch (err) {
        dispatch(logOut());
      } finally {
        dispatch(setLoading(false));
      }
    };

    restoreSession();
  }, [dispatch]);

    // 🛑 2. SOCKET MANAGEMENT: Real-Time Event Bus [3]
// Inside src/App.jsx (Replace your socket useEffect hook with this):

useEffect(() => {
  if (user) {
    socket.connect(); // 🔌 Connect manually [2]

    // 🛑 FIXED: Listen for the native 'connect' event to handle initial connects & automatic reconnects [1, 2]
    socket.on('connect', () => {
      const userId = user._id || user.id;
      socket.emit('register_user', userId); // 🔌 Register User ID securely on the backend registry [2]
      console.log(`🔌 Socket connected (${socket.id}). Registered User ID: ${userId}`);
    });

    // Listen for private, target-specific notifications [2]
    socket.on('notification_received', (notification) => {
      // Show gorgeous toast notification
      toast.success(`✉️ New Alert: ${notification.title}`, {
        duration: 5000
      });
      // Invalidate the cache to instantly increase the bell dot counter [3]
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    // Listen for global published schedules
    socket.on('schedule_published', (data) => {
      toast.success(`📅 Live Update: A new schedule starting on ${data.weekStartDate} has been published!`, {
        duration: 6000
      });
      queryClient.invalidateQueries({ queryKey: ['my-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['live-stats'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] }); // 🛑 Secondary fallback refresh [3]
    });

    // Listen for raw database updates
    socket.on('user_updated', () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['live-stats'] });
    });

    socket.on('role_updated', () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    });

    socket.on('schedule_updated', () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['my-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['live-stats'] });
    });
  }

  return () => {
    // 🧹 Clean up all active listeners safely on logout/unmount
    socket.off('connect');
    socket.off('register_user');
    socket.off('notification_received');
    socket.off('schedule_published');
    socket.off('user_updated');
    socket.off('role_updated');
    socket.off('schedule_updated');
    socket.disconnect(); // Disconnect safely on logout [2]
  };
}, [user, queryClient]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50">
        <p className="text-gray-500 font-medium">Loading session...</p>
      </div>
    );
  }

function PlanningRouter() {
  const { user } = useSelector((state) => state.auth);
  
  const roleName = user?.role?.name; // e.g. "admin", "manager", "employee"
  
  // 🛑 1. ADD THIS DEBUG LOG to see exactly what role React is reading!
  console.log("🛡️ Planning Router check - Logged-in User Role:", roleName);

  if (['admin', 'manager'].includes(roleName)) {
    // If they are an Admin or Manager, show the full interactive grid
    return <PlanningDashboard />;
  }
  
  // If they are a standard Employee (or any other role), show ONLY their personal schedule
  return <PlanningEmployee />;
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

          <Route
            path="users"
            element={
              <ProtectedRoute requiredPermission="employees:view">
                <UsersDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="employees"
            element={
              <ProtectedRoute requiredPermission="employees:view">
                <EmployeesDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="roles"
            element={
              <ProtectedRoute requiredPermission="employees:view">
                <RolesDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="profile" element={<ProfileSettings />} />

          <Route path="planning" element={<PlanningRouter />} /> 

          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
