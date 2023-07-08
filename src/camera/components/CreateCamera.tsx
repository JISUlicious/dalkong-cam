import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDoc } from "firebase/firestore";

import { useAuthContext } from "../../common/contexts/AuthContext";
import { 
  ConnectionActionCreator, 
  DeviceState, 
  useConnectionDispatchContext 
} from "../../common/contexts/ConnectionContext";

import { addItem } from "../../common/functions/storage";

export function CreateCamera () {
  const [input, setInput] = useState("");
  const {user} = useAuthContext();
  const dispatch = useConnectionDispatchContext();
  const navigate = useNavigate();

  function onChange (event: React.ChangeEvent<HTMLInputElement>) {
    setInput(event.target.value);
  }

  function onSubmit (event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const key = `users/${user?.uid}/cameras`;
    const cameraInfo = {
      deviceName: input,
      deviceType: "camera"
    };
    addItem(key, cameraInfo).then(docRef => {
      getDoc(docRef).then(doc => {
        dispatch(ConnectionActionCreator.setLocalDevice(doc as DeviceState));
        navigate(`/camera/${docRef.id}`);
      });
    });
  }

  return <div className="create-camera body-content">
    <h1>CreateCamera</h1>
    <form onSubmit={onSubmit}>
      <label>
        <input onChange={onChange} placeholder="Camera Name" required />
      </label>
      <button type="submit">
        Start Camera
      </button>
    </form>
  </div>;
}