import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import { useAuthContext } from "../../common/contexts/AuthContext";
import { addItem } from "../../common/functions/storage";
import { DocumentSnapshot, getDoc } from "firebase/firestore";
import { CameraState, StreamActionCreator, useStreamDispatchContext } from "../../common/contexts/StreamContext";

export function CreateCamera () {
  const [input, setInput] = useState("");
  const navigate = useNavigate();
  const {user} = useAuthContext();
  const dispatch = useStreamDispatchContext();

  function onChange (event: React.ChangeEvent<HTMLInputElement>) {
    setInput(event.target.value);
  }

  function onSubmit (event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const key = `users/${user?.uid}/cameras`;
    const cameraInfo = {
      cameraName: input
    };
    addItem(key, cameraInfo).then(docRef => {
      console.log(docRef);
      getDoc(docRef).then(doc => {
        console.log(doc);
        dispatch(StreamActionCreator.setCamera(doc as CameraState));
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