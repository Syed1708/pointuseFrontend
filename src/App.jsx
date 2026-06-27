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

export default function App() {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

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
