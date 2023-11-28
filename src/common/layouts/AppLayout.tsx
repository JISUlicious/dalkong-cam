import React from "react";
import {Outlet} from "react-router-dom";

import {Header} from "./Header";
import {Sidebar} from "./Sidebar";


export function AppLayout () {
  return <div className="app-layout">
    <Header />
    <div className="app-body">
      <Outlet />
    </div>
    <Sidebar />
  </div>;
}