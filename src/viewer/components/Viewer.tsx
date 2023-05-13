import "../../common/styles/Viewer.scss";
import React, { ReactNode, useEffect } from "react";
import { CameraItem } from "./CameraItem";
import { addItem, getItem} from "../../common/functions/storage";
import { useAuthContext } from "../../common/contexts/AuthContext";
import { 
  CameraState,
  StreamActionCreator,
  ViewerState,
  useStreamContext,
  useStreamDispatchContext
} from "../../common/contexts/StreamContext";
import { getMedia } from "../../common/functions/getMedia";
import { getDoc } from "firebase/firestore";

export function Viewer () {
  const {user} = useAuthContext();
  const {remoteCameras} = useStreamContext();

  const dispatch = useStreamDispatchContext();
  
  useEffect(() => {
    async function setViewerDoc () {
      if (user) {
        const key = `users/${user?.uid}/cameras`;
        const snapshot = await getItem(key);
        snapshot.docs.forEach(async (document) => {
          const docRef = await addItem(`${key}/${document.id}/viewers`, {});
          const doc = await getDoc(docRef);
          dispatch(StreamActionCreator.setViewer(doc as ViewerState));
          dispatch(StreamActionCreator.addRemoteCamera(document as CameraState))
        });
      }
    }
    
    setViewerDoc();

    getMedia().then(viewerMedia => dispatch(StreamActionCreator.setLocalStream(viewerMedia)));

    return () => {
      dispatch(StreamActionCreator.setLocalStream(null));
      dispatch(StreamActionCreator.clearRemoteCameras());
    }
  }, []);


  const cameraItems: ReactNode[] = [];
  if (remoteCameras) {
    for (const [id, camera] of Object.entries(remoteCameras)) {
      const cameraItem = (<li key={id}>
        <CameraItem
          camera={camera}
        />
      </li>)
      cameraItems.push(cameraItem);
    }
  }


  return <div className="viewer body-content">
    <h1>Viewer</h1>
    {user?.email}
    <div className="list-cameras-wrapper">
      list of camera
      <ul>
        {cameraItems}
      </ul>
    </div>
  </div>;
}