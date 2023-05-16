import "../styles/App.scss";
import "../styles/Sidebar.scss";

import React from "react";

interface SidebarProps {
  isSidebarOpen: boolean
}

export function Sidebar ({isSidebarOpen}: SidebarProps) {
  const hide = isSidebarOpen ? "" : "hide";
  return <div
    className={`sidebar ${hide}`}
  >
    <h1>Sidebar</h1>
  </div>;
}