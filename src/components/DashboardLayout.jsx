import React, { useState, useRef, useEffect } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  FiZap,
  FiGrid,
  FiUsers,
  FiShield,
  FiUser,
  FiSearch,
  FiLogOut,
  FiSettings,
  FiChevronDown,
  FiMenu,
  FiX,
  FiSun,
  FiMoon, // 🛑 Added FiSun & FiMoon
} from "react-icons/fi";
import { logOut } from "../store/authSlice";
import { useTheme } from "../context/ThemeContext"; // 🛑 Import useTheme
import api from "../services/api";

export default function DashboardLayout() {
  const { user } = useSelector((state) => state.auth);
  const { theme, toggleTheme } = useTheme(); // 🛑 Extract Theme States
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error(err);
    } finally {
      dispatch(logOut());
      navigate("/login");
    }
  };

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: FiGrid, end: true },
    { to: "/dashboard/users", label: "Users", icon: FiUsers },
    { to: "/dashboard/employees", label: "Employees", icon: FiUser },
    { to: "/dashboard/roles", label: "Roles", icon: FiShield },
  ];

  // 🛑 Upgraded Sidebar with dark mode styles
  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-white dark:bg-zinc-950 transition-colors">
      <div className="flex h-16 items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800">
        <Link to="/dashboard" className="flex items-center space-x-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 shadow-sm">
            <FiZap className="h-5 w-5" />
          </div>
          <span className="font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Pointuse
          </span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 md:hidden"
        >
          <FiX className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1.5 px-4 py-6">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-50"
              }`
            }
          >
            <item.icon className="mr-3 h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 p-4">
        <div className="flex items-center space-x-3 rounded-lg p-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition">
          {/* 🛑 UPGRADED: Display actual photo if exists */}
          {user?.avatar ? (
            <img
              src={user.avatar}
              className="h-8 w-8 rounded-full object-cover border border-zinc-200 dark:border-zinc-800"
              alt=""
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-900 font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-center uppercase border border-zinc-200 dark:border-zinc-800">
              {user?.name?.charAt(0)}
            </div>
          )}

          <div className="flex-1 overflow-hidden">
            <p className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-50">
              {user?.name}
            </p>
            <p className="truncate text-[10px] text-zinc-400 capitalize">
              {user?.role?.name}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    // 🛑 Added dark:bg-zinc-900 to parent wrapper
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-50/50 dark:bg-zinc-900 transition-colors">
      <aside className="hidden h-screen w-64 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white md:flex">
        <SidebarContent />
      </aside>

      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-zinc-950/20 backdrop-blur-sm md:hidden transition-opacity duration-300"
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-zinc-200 dark:border-zinc-800 bg-white transition-transform duration-300 md:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </div>

      <div className="flex flex-1 flex-col h-screen overflow-hidden">
        {/* 🛑 Upgraded Header with dark mode styles */}
        <header className="flex h-16 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 sm:px-6 transition-colors">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 md:hidden"
            >
              <FiMenu className="h-5 w-5" />
            </button>

            <div className="relative w-48 sm:w-80">
              <FiSearch className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 py-2 pl-9 pr-4 text-xs dark:text-zinc-100 transition focus:border-zinc-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* 🛑 Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-2 text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-950 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 transition"
              title="Toggle theme"
            >
              {theme === "dark" ? (
                <FiSun className="h-4 w-4 text-yellow-400 animate-pulse" />
              ) : (
                <FiMoon className="h-4 w-4 text-zinc-700" />
              )}
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-1.5 pr-2.5 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 transition"
              >
                {/* 🛑 UPGRADED: Display actual photo if exists */}
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    className="h-7 w-7 rounded-full object-cover"
                    alt=""
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 text-xs font-semibold flex items-center justify-center uppercase">
                    {user?.name?.charAt(0)}
                  </div>
                )}
                <span className="hidden text-xs font-semibold text-zinc-700 dark:text-zinc-300 sm:inline">
                  {user?.name}
                </span>
                <FiChevronDown
                  className={`h-3 w-3 text-zinc-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Inside DashboardLayout.jsx Dropdown Popover: */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 origin-top-right rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-1 shadow-md z-50">
                  <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                      {user?.name}
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                      {user?.email}
                    </p>
                  </div>

                  {/* 🛑 Update both buttons to navigate to '/dashboard/profile' */}
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate("/dashboard/profile");
                    }}
                    className="flex w-full items-center rounded-md px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-50 transition"
                  >
                    <FiUser className="mr-2 h-3.5 w-3.5" /> My Profile
                  </button>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate("/dashboard/profile");
                    }}
                    className="flex w-full items-center rounded-md px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-50 transition"
                  >
                    <FiSettings className="mr-2 h-3.5 w-3.5" /> Settings
                  </button>

                  <div className="my-1 border-t border-zinc-100 dark:border-zinc-800"></div>

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center rounded-md px-3 py-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 transition"
                  >
                    <FiLogOut className="mr-2 h-3.5 w-3.5" /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic page area */}
        <main className="flex-1 overflow-y-auto bg-zinc-50/50 dark:bg-zinc-900 p-4 sm:p-8 transition-colors">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
