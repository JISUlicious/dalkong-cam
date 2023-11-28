import React from "react";
import { Link } from "react-router-dom";

interface MainCardProps {
  route: string;
  text: string;
  children: React.ReactNode;
}

export function MainCard({route, text, children}: MainCardProps) {
  return <div className="col py-1">
    <Link to={route}>
      <div className="card">
        <div className="card-image-bottom">
          {children}
        </div>
        <div className="card-body btn btn-primary px-2 py-1 w-100">
          {text}
        </div>
      </div>
    </Link>
  </div>
}