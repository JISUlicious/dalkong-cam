import "../styles/App.scss";
import "../styles/Main.scss";
import {useNavigate} from "react-router-dom";
import {useAuthContext} from "../contexts/AuthContext";
import React from "react";

export function Main () {

  const navigate = useNavigate();
  const { user } = useAuthContext();

  function onClick (event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    const buttonValue = event.currentTarget.value;
    if (buttonValue === "camera") {
      // create room with input name
      navigate(`/camera`);
    } else {
      // join room with input name
      navigate(`/${user?.uid}`);
    }
  }

  return <div className="body-content">
    <h1>Main</h1>
    { user?.email }
    <div className="main-button-wrapper wrapper">
      <h3>Use this device as...</h3>
      <form>
        <button onClick={onClick} type="submit" value="camera">
          Camera
        </button>
        <button onClick={onClick} type="submit" value="viewer">
          Viewer
        </button>
      </form>
    </div>
  </div>;
}