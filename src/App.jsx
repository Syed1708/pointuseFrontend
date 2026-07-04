import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast"; // 🛑 1. FIXED: Imported toast [3]

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
import socket from "./services/socket";
import { useQueryClient } from "@tanstack/react-query";
import TimeclockTerminal from "./pages/Timeclock/TimeclockTerminal";
import TimesheetsDashboard from "./pages/Timesheets/TimesheetsDashboard";
import LeavesDashboard from "./pages/Leaves/LeavesDashboard";

export default function App() {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { user, loading } = useSelector((state) => state.auth);
  const API_URL = import.meta.env.VITE_API_URL;
  // 1. Session Restoration on Mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await axios.post(
          `${API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true },
        );

        const { accessToken } = res.data;

        const profileRes = await axios.get(
          `${API_URL}/api/users/profile`,
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

  // 2. SOCKET MANAGEMENT: Real-Time Event Bus [3]
  useEffect(() => {
    if (user) {
      socket.connect();

      // Listen for the native 'connect' event to handle reconnects safely [1, 2]
      socket.on("connect", () => {
        const userId = user._id || user.id;
        socket.emit("register_user", userId);
        console.log(
          `🔌 Socket connected (${socket.id}). Registered User ID: ${userId}`,
        );
      });

      // Listen for private, target-specific notifications [2]
      socket.on("notification_received", (notification) => {
        console.log("✉️ Received private live notification:", notification);
        toast.success(`✉️ New Alert: ${notification.title}`, {
          duration: 5000,
        });
        queryClient.invalidateQueries({ queryKey: ["notifications"] }); // Live refresh the badge [3]
      });

      // 🛑 LIVE TIMESHEETS REFRESH LISTENER
      // Automatically invalidates the stats query cache on any clock-in or out [3]
      socket.on("timeclock_updated", () => {
        queryClient.invalidateQueries({ queryKey: ["live-stats"] }); // Live reload dashboard counters [3]
      });
      // Listen for global published schedules
      socket.on("schedule_published", (data) => {
        toast.success(
          `📅 Live Update: A new schedule starting on ${data.weekStartDate} has been published!`,
          {
            duration: 6000,
          },
        );
        queryClient.invalidateQueries({ queryKey: ["my-schedule"] });
        queryClient.invalidateQueries({ queryKey: ["schedules"] });
        queryClient.invalidateQueries({ queryKey: ["live-stats"] });
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      });

      // Listen for raw database updates [3]
      socket.on("user_updated", () => {
        queryClient.invalidateQueries({ queryKey: ["users"] });
        queryClient.invalidateQueries({ queryKey: ["employees"] });
        queryClient.invalidateQueries({ queryKey: ["live-stats"] });
      });

      socket.on("role_updated", () => {
        queryClient.invalidateQueries({ queryKey: ["roles"] });
      });

      socket.on("schedule_updated", () => {
        queryClient.invalidateQueries({ queryKey: ["schedules"] });
        queryClient.invalidateQueries({ queryKey: ["my-schedule"] });
        queryClient.invalidateQueries({ queryKey: ["live-stats"] });
      });
    }

    return () => {
      socket.off("connect");
      socket.off("register_user");
      socket.off("notification_received");
      socket.off("schedule_published");
      socket.off("user_updated");
      socket.off("role_updated");
      socket.off("schedule_updated");
      socket.disconnect();
    };
  }, [user, queryClient]);

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
        {/* 🛑 ADD THIS LINE FIRST: Automatically redirects the root "/" to "/dashboard" [1] */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* 1. Public Sign In Route */}
        <Route path="/login" element={<Login />} />

        {/* 2. Standalone Shared Terminal Route (Keep this public and independent) */}
        <Route path="/timeclock" element={<TimeclockTerminal />} />

        {/* 3. Nested Dashboard Workspace Route */}
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
          <Route
            path="timesheets"
            element={
              <ProtectedRoute requiredPermission="employees:view">
                <TimesheetsDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="leaves" element={<LeavesDashboard />} /> 

          <Route path="profile" element={<ProfileSettings />} />

          <Route path="planning" element={<PlanningRouter />} />

          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

// =========================================================================
// 🛑 2. FIXED: PlanningRouter declared OUTSIDE the App component [3]
// This prevents component re-creation and unmounting flickering on state changes [3].
// =========================================================================
function PlanningRouter() {
  const { user } = useSelector((state) => state.auth);
  const roleName = user?.role?.name;

  console.log("🛡️ Planning Router check - Logged-in User Role:", roleName);

  if (["admin", "manager"].includes(roleName)) {
    return <PlanningDashboard />;
  }

  return <PlanningEmployee />;
}
