import React from "react";
import {useAuthContext} from "../contexts/AuthContext";
import {signOutApp} from "../functions/auth";
import {useNavigate} from "react-router-dom";


export function Header () {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  function onSignOut () {
    signOutApp();
    return navigate("/");
  }

  return <div>
    <h1>Header</h1>
    { user?.uid && <button
      className={"sign-out"}
      onClick={onSignOut}
    >
      sign out
    </button> }
  </div>;
}