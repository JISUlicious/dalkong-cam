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
  const localValue = localStorage.getItem("cameraDeviceName");
  const initialValue = localValue ? localValue : "";

  const [input, setInput] = useState(initialValue);
  const {user} = useAuthContext();
  const dispatch = useConnectionDispatchContext();
  const navigate = useNavigate();

  function onChange (event: React.ChangeEvent<HTMLInputElement>) {
    setInput(event.target.value);
  }

  function onSubmit (event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const key = `users/${user?.uid}/cameras`;
    const sessionId = Date.now();
    const cameraInfo = {
      deviceName: input,
      deviceType: "camera",
      sessionId: sessionId
    };
    addItem(key, cameraInfo).then(docRef => {
      getDoc(docRef).then(doc => {
        dispatch(ConnectionActionCreator.setLocalDevice(doc as DeviceState));
        navigate(`/camera/${docRef.id}`);
        localStorage.setItem("deviceName", input);
      });
    });
  }

  return <div className="create-camera body-content container-fluid pt-3">
    <div className="card">
      <div className="card-header fs-5">CreateCamera</div>
      <div className="card-body">       
        <form onSubmit={onSubmit}>
          <div className="input-group mb-3">
            <input className="form-control" onChange={onChange} value={input} placeholder="Camera Name" required />
            <button type="submit" className="btn btn-outline-secondary" id="button-addon2">
              Start Camera
            </button>
          </div>
        </form>
      </div>
    </div>    
  </div>;
}