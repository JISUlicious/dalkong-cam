import React from "react"
import { Link } from "react-router-dom"

export function ConnectionClosed() {
  return <div className="camera body-content container-fluid w-100 px-0">
  <div className="container-fluid px-0 position-relative">
    <div className="row p-5 text-center">
      <div className="fs-5">Connection Closed</div>
    </div>
    <div className="row p-3 text-center">
      <Link to={'/'}>
        <div className="btn btn-primary px-2 py-1 w-50">
          {'back to Main'}
        </div>
      </Link>
    </div>
  </div>
</div>;
}