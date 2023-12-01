import React from "react";
import { FiCamera, FiMonitor } from "react-icons/fi";
import { MainCard } from "../components/MainCard";

export function Main() {

  return <div className="body-content">
    <div className="container-fluid pt-3 text-center">
      <div className="row pt-3">
        <h4>Use this device as...</h4>
      </div>
      <div className="row gx-3 mx-auto justify-content-center">
        <MainCard route="/camera" text="Camera">
          <FiCamera className="icon icon-main"  size={'15vw'} style={{margin: '5vw'}} />
        </MainCard>
        <MainCard route="/viewer" text="Viewer">
          <FiMonitor className="icon icon-main"  size={'15vw'} style={{margin: '5vw'}} />
        </MainCard>
      </div>
    </div>
  </div>;
}