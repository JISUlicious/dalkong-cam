import "../styles/Header.scss";
import React from "react";
import {useAuthContext} from "../contexts/AuthContext";
import {signOutApp} from "../functions/auth";
import {useNavigate} from "react-router-dom";
import {FiMenu} from "react-icons/fi";

interface HeaderProps {
  toggleSidebar: () => void
}

export function Header ({toggleSidebar}: HeaderProps) {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  function onSignOut () {
    signOutApp().then(() => navigate("/"));
  }

  return <div className="header">
    <div className="menu-button-box box">
      <FiMenu onClick={toggleSidebar}/>
    </div>
    <div className="title-box box">
      <h1>Header</h1>
    </div>
    <div className="sign-out-button-box box">
      { user?.uid ? <button
        className="sign-out"
        onClick={onSignOut}
      >
        sign out
        </button> : <button className="text-only-button"></button> }
    </div>
  </div>;
}