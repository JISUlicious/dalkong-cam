import { Link, useNavigate } from "react-router-dom";

import React, { useEffect, useState } from "react";
import { useAuthContext } from "../contexts/AuthContext";
import { signOutApp } from "../functions/auth";
import { SideBarItem } from "./SideBarItem";

export function Sidebar () {
  const {user} = useAuthContext();
  const [darkModeOn, setDarkModeOn] = useState<number>(0);
  function onToggleDarkMode () {
    if (darkModeOn) {
      setDarkModeOn(0);
    } else {
      setDarkModeOn(1);
    }
  }

  const body = document.querySelector("html");
  useEffect(()=>{
    if (darkModeOn) {
      body?.setAttribute("data-bs-theme", "dark")
    } else {
      body?.setAttribute("data-bs-theme", "light")
    }
  }, [darkModeOn]);

  const navigate = useNavigate();

  function onSignOut () {
    signOutApp().then(() => navigate("/"));
  }


  return <div
    id="offcanvasNavbar"
    className="sidebar-wrapper offcanvas offcanvas-end"
    tabIndex={-1}
    aria-labelledby="offcanvasNavbarLabel"
  >
    <div className="offcanvas-header justify-content-end">
      <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
    </div>
    <div className="offcanvas-body">
      <ul className="navbar-nav justify-content-end flex-grow-1 pe-3 pb-3">
        <SideBarItem route="/" text="Home"/>
        {user 
          ? <SideBarItem route="/camera" text="Camera" />
          : null
        }
        {user 
          ? <SideBarItem route="/viewer" text="Viewer" />
          : null
        }
        {user 
          ? <SideBarItem route="/history" text="History" />
          : null
        }
      </ul>
      <div className="form-check form-switch">
        <input 
          className="form-check-input" 
          type="checkbox" 
          role="switch" 
          id="flexSwitchCheckDefault" 
          value={darkModeOn} 
          onChange={onToggleDarkMode}/>
        <label className="form-check-label" htmlFor="flexSwitchCheckDefault">Turn on dark mode</label>
      </div>
    </div>
    <div className="offcanvas-footer">
      <div className="d-grid gap-2">
      {user 
        ? <button type="button" className="btn btn-outline-secondary float-end" data-bs-dismiss="offcanvas" onClick={onSignOut}>
          Sign Out
        </button>
        : null
      }
      </div>
    </div>
  </div>;
}