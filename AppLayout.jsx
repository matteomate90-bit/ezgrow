import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className="flex-1 lg:ml-0 overflow-auto">
        <div className="bg-[#e9f2d4] mx-auto pt-16 p-4 max-w-7xl sm:p-6 lg:p-8 lg:pt-8">
          <Outlet />
        </div>
      </main>
    </div>);

}
