import { Link } from "react-router-dom";
import "../styles/App.scss";
import "../styles/Sidebar.scss";

import React from "react";
import { useAuthContext } from "../contexts/AuthContext";

interface SidebarProps {
  isSidebarOpen: boolean,
  toggleSidebar: () => void
}

export function Sidebar ({isSidebarOpen, toggleSidebar}: SidebarProps) {
  const {user} = useAuthContext();
  const hide = isSidebarOpen ? "" : "hide";

  return <div
    className={`sidebar-wrapper ${hide}`}
    onClick={toggleSidebar}
  >
    <div className="sidebar" onClick={(event) => event.stopPropagation()}>
      <div>
        <Link to="/">
          <button className="text-only-button" onClick={toggleSidebar}>
            Home
          </button>
        </Link>
      </div>
      {user 
        ? <>
        <div>
          <Link to="/camera">
            <button className="text-only-button" onClick={toggleSidebar}>
              Camera
            </button>
          </Link>
        </div>
        <div>
          <Link to={"/viewer"}>
            <button className="text-only-button" onClick={toggleSidebar}>
              Viewer
            </button>
          </Link>
        </div>
        <div>
          <Link to={"/history"}>
            <button className="text-only-button" onClick={toggleSidebar}>
              History
            </button>
          </Link>
        </div>
        </>
        : null}
      </div>
  </div>;
}