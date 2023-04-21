import {Link, useNavigate} from "react-router-dom";
import {useAuthContext} from "../contexts/AuthContext";
import React, {useState} from "react";
import "../styles/App.scss";
import "../styles/Main.scss";

export function Main () {

  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [roomName, setRoomName] = useState("");
  function onChange (event: React.ChangeEvent<HTMLInputElement>) {
    setRoomName(event.target.value);
  }
  function onClick (event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    const buttonValue = event.currentTarget.value;
    if (buttonValue === "create") {
      // create room with input name
      navigate(`/room/${roomName}`, {state: roomName});
    } else {
      // join room with input name
      navigate(`/room/${roomName}`, {state: roomName});
    }
  }

  return <div>
    <h1>Main</h1>
    { user?.email }
    <Link to={"/room/create"}>to CreateRoom</Link>
    <div className="main-button-wrapper">
      <form>
        <label>
          <input onChange={onChange} placeholder="Room Name" required={true} />
        </label>
        <button onClick={onClick} type="submit" value="create">
          create room
        </button>
        <button onClick={onClick} type="submit" value="join">
          join room
        </button>
      </form>
    </div>
  </div>;
}