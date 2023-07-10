import React from "react";
import { Link } from "react-router-dom";

import { useAuthContext } from "../contexts/AuthContext";

export function Main () {

  const { user } = useAuthContext();

  return <div className="body-content">
    <div className="container-fluid pt-3 text-center">
      <div className="row">
        <h1>Hello, { user?.email }</h1>
      </div>
      <div className="row pb-3">
        <h4>Use this device as...</h4>
      </div>
      <div className="row gx-5 mx-auto">
        <div className="col">
          <Link to="/camera">
            <button className="btn btn-primary float-end">
              Camera
            </button>
          </Link>
        </div>
        <div className="col">
          <Link to={"/viewer"}>
            <button className="btn btn-primary float-start">
              Viewer
            </button>
          </Link>
        </div>
      </div>
    </div>
  </div>;
}