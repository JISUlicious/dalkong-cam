import {Link} from "react-router-dom";
import {useAuthContext} from "../contexts/AuthContext";
import React from "react";

export function Main () {
  const { user } = useAuthContext();

  function onClick (event: React.MouseEvent<HTMLButtonElement>) {
    const buttonValue: string = event.currentTarget.value;
    console.log(buttonValue);
  }

  return <div>
    <h1>Main</h1>
    { user?.email }
    <Link to={"/room/create"}>to CreateRoom</Link>
    <div>
      <button onClick={onClick} value="create">
        create room
      </button>
    </div>
    <div>
      <button onClick={onClick} value="join">
        join room
      </button>
    </div>
  </div>;
}