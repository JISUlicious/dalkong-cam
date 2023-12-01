import React from "react";
import { Link } from "react-router-dom";

interface SideBarItemProps {
  route: string;
  text: string;
}

export function SideBarItem({ route, text }: SideBarItemProps) {
  return <li className="nav-item">
    <Link to={route}>
      <button className="btn btn-link text-start" data-bs-dismiss="offcanvas" type="button">
        {text}
      </button>
    </Link>
  </li>
}