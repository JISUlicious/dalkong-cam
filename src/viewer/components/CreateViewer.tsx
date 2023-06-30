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

export function CreateViewer () {
  const localValue = localStorage.getItem("viewerDeviceName");
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

    const key = `users/${user?.uid}/viewers`;
    const sessionId = Date.now();
    const viewerInfo = {
      deviceName: input,
      deviceType: "viewer",
      sessionId: sessionId
    };
    addItem(key, viewerInfo).then(docRef => {
      getDoc(docRef).then(doc => {
        dispatch(ConnectionActionCreator.setLocalDevice(doc as DeviceState));
        navigate(`/viewer/${docRef.id}`);
      });
    });
  }

  return <div className="create-viewer body-content">
    <h1>CreateViewer</h1>
    <form onSubmit={onSubmit}>
      <label>
        <input onChange={onChange} value={input} placeholder="Viewer Name" required />
      </label>
      <button type="submit">
        Submit
      </button>
    </form>
  </div>;
}