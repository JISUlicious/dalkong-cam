import "../styles/Header.scss";
import React, {Dispatch} from "react";
import {useAuthContext} from "../contexts/AuthContext";
import {signOutApp} from "../functions/auth";
import {useNavigate} from "react-router-dom";
import {FiMenu} from "react-icons/fi";

interface HeaderProps {
  isSidebarOpen: boolean,
  toggleSidebar: Dispatch<boolean>
}

export function Header ({isSidebarOpen, toggleSidebar}: HeaderProps) {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  function onSignOut () {
    signOutApp().then(() => navigate("/"));
  }

  function onClickMenu () {
    toggleSidebar(!isSidebarOpen);
  }

  return <div className="header">
    <div className="menu-button-box box">
      <FiMenu onClick={onClickMenu}/>
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