import "../styles/App.scss";
import "../styles/Main.scss";

import React from "react";
import { Link } from "react-router-dom";

import { useAuthContext } from "../contexts/AuthContext";

export function Main () {

  const { user } = useAuthContext();

  return <div className="body-content">
    <h1>Main</h1>
    { user?.email }
    <div className="main-button-wrapper wrapper">
      <h3>Use this device as...</h3>
      <Link to="/camera">
        <button>
          Camera
        </button>
      </Link>
      <Link to={"/viewer"}>
        <button>
          Viewer
        </button>
      </Link>
    </div>
  </div>;
}