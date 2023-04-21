import {Header} from "../components/Header";
import {Sidebar} from "../components/Sidebar";
import {Outlet} from "react-router-dom";
import "../styles/App.scss";


export function AppLayout () {

  return <div className="app-layout">
    <Header />
    <Sidebar />
    <Outlet />
  </div>;
}