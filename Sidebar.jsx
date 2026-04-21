import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Sprout, Thermometer, ClipboardList, BookOpen, Menu, X, LogOut, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

const navItems = [
{ label: 'Dashboard', path: '/', icon: LayoutDashboard },
{ label: 'Piante', path: '/plants', icon: Sprout },
{ label: 'Ambiente', path: '/environment', icon: Thermometer },
{ label: 'Attività', path: '/tasks', icon: ClipboardList },
{ label: 'Diario', path: '/journal', icon: BookOpen },
{ label: 'Community', path: '/community', icon: Globe }];


export default function Sidebar({ isOpen, onToggle }) {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen &&
      <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onToggle} />
      }

      {/* Mobile toggle */}
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-card shadow-md border border-border">
        
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full z-50 w-64
        bg-sidebar text-sidebar-foreground
        border-r border-sidebar-border
        transform transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
        flex flex-col
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="bg-sidebar-primary/20 opacity-75 rounded-xl w-10 h-10 flex items-center justify-center">
              <Sprout className="w-5 h-5 text-sidebar-primary" />
            </div>
            <div>
              <h1 className="text-sidebar-foreground text-lg font-bold">CultivApp</h1>
              <p className="text-xs text-sidebar-foreground/50">Gestione Coltivazione Indoor</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => window.innerWidth < 1024 && onToggle()}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive ?
                'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20' :
                'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}
                `
                }>
                
                <item.icon className="w-4.5 h-4.5" />
                {item.label}
              </Link>);

          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => base44.auth.logout()}>
            
            <LogOut className="w-4 h-4 mr-2" />
            Esci
          </Button>
        </div>
      </aside>
    </>);

}
