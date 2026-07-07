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
  FiMoon, 
  FiCalendar,
  FiCheckSquare,
  FiCoffee
} from "react-icons/fi";
import { logOut } from "../store/authSlice";
import { useTheme } from "../context/ThemeContext"; 
import api from "../services/api";
import NotificationBell from "./NotificationBell";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next"; // 🛑 i18n Import [1]

export default function DashboardLayout() {
  const { user } = useSelector((state) => state.auth);
  const { theme, toggleTheme } = useTheme(); 
  const { t, i18n } = useTranslation(); // 🛑 Extract Translation tools [1]

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Parse active language safely (e.g. converts "en-US" -> "en") [1]
  const currentLang = i18n.language?.split('-')[0] || 'en';

  const toggleLanguage = () => {
    const nextLang = currentLang === 'en' ? 'fr' : 'en';
    i18n.changeLanguage(nextLang); // Changes languages globally instantly [1]
  };

  // Fetch live restaurant configurations
  const { data: settings } = useQuery({
    queryKey: ['live-settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data;
    }
  });

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

  // ==========================================
  // 🛑 1. UPGRADED: Dynamic Translated Navigation Items list [2]
  // ==========================================
  const navItems = [
    { to: '/dashboard', label: t('sidebar.dashboard'), icon: FiGrid, end: true },
    { to: '/dashboard/users', label: t('sidebar.users'), icon: FiUsers, permission: 'employees:view' },
    { to: '/dashboard/employees', label: t('sidebar.employees'), icon: FiUser, permission: 'employees:view' },
    { to: '/dashboard/timesheets', label: t('sidebar.timesheets'), icon: FiCheckSquare, permission: 'employees:view' },
    { to: '/dashboard/leaves', label: t('sidebar.leaves'), icon: FiCoffee }, 
    { to: '/dashboard/roles', label: t('sidebar.roles'), icon: FiShield, permission: 'employees:view' },
    { to: '/dashboard/planning', label: t('sidebar.planning'), icon: FiCalendar },
    { to: '/dashboard/settings', label: t('sidebar.settings'), icon: FiSettings, permission: 'employees:view' }, 
  ];

  // Filter navItems dynamically based on current user's DB permissions [2]
  const filteredNavItems = navItems.filter((item) => {
    if (!item.permission) return true; // Public item
    const isAdmin = user?.role?.name === 'admin';
    return user?.role?.permissions?.includes(item.permission) || isAdmin;
  });

  
  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-white dark:bg-zinc-950 transition-colors">
      
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800">
        <Link to="/dashboard" className="flex items-center space-x-2">
          {settings?.logo ? (
            <img src={settings.logo} className="h-9 w-9 rounded-lg object-contain" alt="" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 shadow-sm">
              <FiZap className="h-5 w-5" />
            </div>
          )}
          <span className="font-bold text-zinc-900 dark:text-zinc-50 tracking-tight truncate max-w-35">
            {settings?.name || 'Pointuse'}
          </span>
        </Link>
        <button onClick={() => setMobileMenuOpen(false)} className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 md:hidden">
          <FiX className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 px-4 py-6">
        {filteredNavItems.map((item) => (
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

      {/* Sidebar Footer with Integrated Direct Logout Button */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 p-4">
        {/* 🛑 UPGRADED: Changed to justify-between to allow side-by-side elements [2] */}
        <div className="flex items-center justify-between rounded-lg p-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
          
          {/* Left Side: Avatar & Text details (Restricted width to prevent overlap) */}
          <div className="flex items-center space-x-3 overflow-hidden flex-1 mr-2">
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

            <div className="overflow-hidden">
              <p className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                {user?.name}
              </p>
              <p className="truncate text-[10px] text-zinc-400 capitalize">
                {user?.role?.name}
              </p>
            </div>
          </div>

          {/* 🛑 NEW RIGHT SIDE: Direct logout icon button [2] */}
          <button
            onClick={handleLogout}
            className="rounded-lg p-2 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
            title={t('common.logout')} // Displays translated native tooltip on hover [2]
          >
            <FiLogOut className="h-4 w-4" />
          </button>

        </div>
      </div>
    </div>
  );

  return (
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
        {/* Header with dark mode styles */}
        <header className="flex h-16 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 sm:px-6 transition-colors">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 md:hidden"
            >
              <FiMenu className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center space-x-4">
            {/* 🛑 2. UPGRADED: Language Toggle Button (Styled beautifully next to theme toggle) */}
            <button
              onClick={toggleLanguage}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-2.5 py-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-950 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 uppercase transition-all"
              title="Toggle Language"
            >
              {currentLang}
            </button>
            
            <NotificationBell />
            
            {/* Theme Toggle Button */}
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

              {/* Profile Dropdown Popover */}
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

                  {/* 🛑 3. UPGRADED: Dropdown items translated dynamically! [2] */}
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate("/dashboard/profile");
                    }}
                    className="flex w-full items-center rounded-md px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-50 transition"
                  >
                    <FiUser className="mr-2 h-3.5 w-3.5" /> {t('common.profile')}
                  </button>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate("/dashboard/profile");
                    }}
                    className="flex w-full items-center rounded-md px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-50 transition"
                  >
                    <FiSettings className="mr-2 h-3.5 w-3.5" /> {t('common.settings')}
                  </button>

                  <div className="my-1 border-t border-zinc-100 dark:border-zinc-800"></div>

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center rounded-md px-3 py-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 transition"
                  >
                    <FiLogOut className="mr-2 h-3.5 w-3.5" /> {t('common.logout')}
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