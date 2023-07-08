import "../styles/App.scss";

import React, {useCallback, useState} from "react";
import {Outlet} from "react-router-dom";

import {Header} from "../components/Header";
import {Sidebar} from "../components/Sidebar";


export function AppLayout () {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(isSidebarOpen => !isSidebarOpen);
  }, []);
  return <div className="app-layout">
    <Header toggleSidebar={toggleSidebar} />
    <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
    <div className="app-body">
      <Outlet />
    </div>
  </div>;
}