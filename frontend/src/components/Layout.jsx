import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  LogOut,
  Menu,
  X,
  Shield,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  Bell,
  User as UserIcon,
} from 'lucide-react';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    {
      name: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      roles: ['Admin', 'Manager', 'Employee'],
      badge: null,
    },
    {
      name: 'Leads CRM',
      path: '/leads',
      icon: Briefcase,
      roles: ['Admin', 'Manager', 'Employee'],
      badge: 'Active',
    },
    {
      name: 'Employee Panel',
      path: '/employees',
      icon: Users,
      roles: ['Admin', 'Manager'],
      badge: null,
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: SettingsIcon,
      roles: ['Admin', 'Manager', 'Employee'],
      badge: null,
    },
  ];

  // Filter links by active user role
  const allowedLinks = navLinks.filter(
    (link) => !link.roles || (user && link.roles.includes(user.role))
  );

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'Admin':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'Manager':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      default:
        return 'bg-crm-info/20 text-crm-info border border-crm-info/30';
    }
  };

  // Generate dynamic breadcrumbs
  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/leads/')) return 'Leads / Details';
    if (path === '/leads') return 'Leads CRM';
    if (path === '/employees') return 'Employee Panel';
    if (path === '/settings') return 'Account Settings';
    return 'CRM Platform';
  };

  return (
    <div className="flex min-h-screen bg-crm-dark text-crm-text bg-mesh">
      {/* Mobile Header Banner */}
      <header className="flex w-full items-center justify-between border-b border-crm-border bg-crm-card/90 px-6 py-4 md:hidden fixed top-0 z-40 backdrop-blur-md">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-crm-primary animate-pulse" />
          <span className="text-lg font-bold tracking-wider bg-gradient-to-r from-crm-primary to-violet-400 bg-clip-text text-transparent">
            MINI CRM
          </span>
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded-lg p-2 text-crm-textMuted hover:bg-crm-border hover:text-crm-text focus:outline-none"
        >
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {/* Backdrop for Mobile Sidebar */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Navigation Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col justify-between border-r border-crm-border bg-crm-card/75 backdrop-blur-xl transition-all duration-300 ease-in-out md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          sidebarCollapsed ? 'md:w-20' : 'md:w-64'
        } ${sidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72'}`}
      >
        <div>
          {/* Brand Header */}
          <div className="flex items-center justify-between border-b border-crm-border px-6 py-5">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="rounded-xl bg-crm-primary/10 p-2 border border-crm-primary/20 flex-shrink-0">
                <Shield className="h-6 w-6 text-crm-primary shadow-glow" />
              </div>
              {!sidebarCollapsed && (
                <span className="text-lg font-bold tracking-wider bg-gradient-to-r from-crm-primary to-indigo-400 bg-clip-text text-transparent truncate animate-fade-in">
                  MiniCRM
                </span>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-1.5 text-crm-textMuted hover:bg-crm-border hover:text-crm-text md:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Profile Summary */}
          {user && !sidebarCollapsed && (
            <div className="mx-4 my-6 rounded-2xl bg-crm-dark/50 border border-crm-border/60 p-4 animate-fade-in">
              <div className="flex items-center space-x-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-crm-primary text-white font-semibold shadow-glow text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <h4 className="truncate text-xs font-semibold">{user.name}</h4>
                  <p className="truncate text-xxs text-crm-textMuted">{user.email}</p>
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <span className={`rounded px-1.5 py-0.5 text-xxs font-semibold uppercase tracking-wider ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
              </div>
            </div>
          )}

          {user && sidebarCollapsed && (
            <div className="my-6 flex justify-center animate-fade-in">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-crm-primary text-white font-semibold shadow-glow text-sm cursor-pointer" onClick={() => navigate('/settings')}>
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="mt-4 space-y-1 px-3">
            {allowedLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 relative group active:scale-98 ${
                    sidebarCollapsed ? 'justify-center' : 'space-x-3.5'
                  } ${
                    isActive
                      ? 'bg-crm-primary/10 text-crm-primary font-semibold border-l-4 border-crm-primary'
                      : 'text-crm-textMuted hover:bg-crm-border/40 hover:text-crm-text'
                  }`}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-crm-primary' : 'text-crm-textMuted'}`} />
                  
                  {!sidebarCollapsed && (
                    <span className="animate-fade-in flex-1 truncate">{link.name}</span>
                  )}

                  {link.badge && !sidebarCollapsed && (
                    <span className="rounded bg-crm-success/20 border border-crm-success/30 px-1 text-xxs font-semibold text-crm-success">
                      {link.badge}
                    </span>
                  )}

                  {/* Tooltip on Hover in Collapsed Mode */}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-3 px-2 py-1 rounded bg-crm-card border border-crm-border text-xs text-crm-text font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap shadow-xl">
                      {link.name}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer (Logout) */}
        <div className="border-t border-crm-border p-4">
          <button
            onClick={handleLogout}
            className={`flex items-center rounded-xl px-4 py-3 text-sm font-medium text-red-400 transition-all duration-200 hover:bg-red-500/10 hover:text-red-300 w-full ${
              sidebarCollapsed ? 'justify-center' : 'space-x-3.5'
            }`}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="animate-fade-in">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Core Window Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Navbar */}
        <header className="hidden md:flex items-center justify-between border-b border-crm-border/80 bg-crm-card/50 backdrop-blur-md px-8 py-4 sticky top-0 z-30">
          {/* Left part: collapse toggle and breadcrumbs */}
          <div className="flex items-center space-x-6">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="rounded-lg p-1.5 text-crm-textMuted hover:bg-crm-border hover:text-crm-text focus:outline-none transition-colors border border-crm-border/60 bg-crm-dark/20"
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>

            {/* Breadcrumbs */}
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-crm-textMuted">Platform</span>
              <span className="text-crm-border">/</span>
              <span className="font-semibold text-crm-text tracking-wide">{getBreadcrumbs()}</span>
            </div>
          </div>

          {/* Right part: quick notification + user actions */}
          <div className="flex items-center space-x-5">
            {/* Notification Bell */}
            <button className="relative rounded-lg p-1.5 text-crm-textMuted hover:bg-crm-border hover:text-crm-text transition-all focus:outline-none">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-crm-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-crm-primary"></span>
              </span>
            </button>

            <div className="h-5 w-px bg-crm-border" />

            {/* Quick Settings Icon */}
            <button
              onClick={() => navigate('/settings')}
              className="rounded-lg p-1.5 text-crm-textMuted hover:bg-crm-border hover:text-crm-text transition-all focus:outline-none"
            >
              <SettingsIcon className="h-5 w-5" />
            </button>

            {/* User Avatar Info */}
            {user && (
              <div className="flex items-center space-x-3 pl-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-crm-primary text-white text-xs font-semibold shadow-glow select-none">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-xs font-medium text-crm-text leading-tight">{user.name}</p>
                  <p className="text-xxs text-crm-textMuted leading-tight">{user.role}</p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="container mx-auto px-4 pt-24 pb-8 md:px-8 md:pt-8 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
