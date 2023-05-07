import "../styles/App.scss";
import {Header} from "../components/Header";
import {Sidebar} from "../components/Sidebar";
import {Outlet} from "react-router-dom";
import React, {useCallback, useState} from "react";


export function AppLayout () {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(isSidebarOpen => !isSidebarOpen);
  }, []);
  return <div className="app-layout">
    <Header toggleSidebar={toggleSidebar} />
    <Sidebar isSidebarOpen={isSidebarOpen}/>
    <div className="app-body">
      <Outlet />
    </div>
  </div>;
}