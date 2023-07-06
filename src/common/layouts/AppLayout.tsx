import React from "react";
import {Outlet} from "react-router-dom";

import {Header} from "../components/Header";
import {Sidebar} from "../components/Sidebar";


export function AppLayout () {
  return <div className="app-layout">
    <Header />
    <Sidebar />
    <div className="app-body">
      <Outlet />
    </div>
  </div>;
}