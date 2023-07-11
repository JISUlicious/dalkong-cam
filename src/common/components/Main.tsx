import React from "react";
import { Link } from "react-router-dom";

export function Main () {

  return <div className="body-content">
    <div className="container-fluid pt-3 text-center">
      <div className="row pt-3">
        <h4>Use this device as...</h4>
      </div>
      <div className="row gx-3 mx-auto justify-content-center">
        <div className="col py-1">
          <Link to="/camera">
            <div className="card">
              <img className="card-img-bottom" alt="camera" src="./camera.jpeg" />
            
              <div className="card-body btn btn-primary px-2 py-1 text-body w-100">
                Camera
              </div>
            </div>
          </Link>
        </div>
        <div className="col py-1">
          <Link to="/viewer">
            <div className="card">
              <img className="card-img-bottom" alt="viewer" src="viewer.jpg" />
              <div className="card-body btn btn-primary px-2 py-1 text-body w-100">
                viewer
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  </div>;
}