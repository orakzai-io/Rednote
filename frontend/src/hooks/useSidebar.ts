import { useState } from 'react';

export function useSidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return {
    sidebarOpen,
    toggleSidebar,
  };
}
