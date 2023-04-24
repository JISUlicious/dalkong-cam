import {useNavigate} from "react-router-dom";
import React, {useState} from "react";

export function CreateCamera () {
  const [input, setInput] = useState("");
  const navigate = useNavigate();

  function onChange (event: React.ChangeEvent<HTMLInputElement>) {
    setInput(event.target.value);
  }

  function onSubmit (event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // create camera document
    // get camera document id
    const cameraId = input; // replace with id later
    navigate(`/camera/${cameraId}`);
  }

  return <div className="create-camera body-content">
    <h1>CreateCamera</h1>
    <form onSubmit={onSubmit}>
      <label>
        <input onChange={onChange} placeholder="Camera Name" required />
      </label>
      <button type="submit">
        Camera
      </button>
    </form>
  </div>;
}