import { useState } from 'react';

function isMobile() {
  return typeof window !== 'undefined' && window.innerWidth <= 768;
}

export function useSidebar() {
  // Start closed on mobile so chat fills the screen; open on desktop
  const [sidebarOpen, setSidebarOpen] = useState(() => !isMobile());

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return {
    sidebarOpen,
    toggleSidebar,
  };
}
