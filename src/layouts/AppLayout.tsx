import "../styles/App.scss";
import {Header} from "../components/Header";
import {Sidebar} from "../components/Sidebar";
import {Outlet} from "react-router-dom";
import {useState} from "react";


export function AppLayout () {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  return <div className="app-layout">
    <Header isSidebarOpen={isSidebarOpen} toggleSidebar={setIsSidebarOpen} />
    <Sidebar isSidebarOpen={isSidebarOpen}/>
    <div className="app-body">
      <Outlet />
    </div>
  </div>;
}