import React from "react";
import { FiMenu } from "react-icons/fi";

export function Header () {
  
  return <nav className="navbar bg-primary sticky-top">
    <div className="container-fluid">
      <div className="navbar-brand">
        <div className="fs-6">Dalkong-Cam</div>
      </div>
      <button 
        className="navbar-toggler" 
        type="button" 
        data-bs-toggle="offcanvas" 
        data-bs-target="#offcanvasNavbar" 
        aria-controls="offcanvasNavbar" 
        aria-label="Toggle navigation">
        <FiMenu />
      </button>
    </div>
  </nav>;
}