import {Header} from "../components/Header";
import {Sidebar} from "../components/Sidebar";
import {Outlet} from "react-router-dom";

export function AppLayout () {
  return <>
    <Header />
    <Sidebar />
    <Outlet />
  </>;
}