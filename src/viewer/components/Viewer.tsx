import "../../common/styles/Viewer.scss";
import React, { ReactNode, useEffect } from "react";
import { useParams } from "react-router-dom";
import { CameraItem } from "./CameraItem";
import { getItem} from "../../common/functions/storage";
import { useAuthContext } from "../../common/contexts/AuthContext";
import { 
  CameraState,
  StreamActionCreator,
  useStreamContext,
  useStreamDispatchContext
} from "../../common/contexts/StreamContext";
import { getMedia } from "../../common/functions/getMedia";


// TODO: 
// viewer로 재접속 시 연결 안되는 것 해결

export function Viewer () {
  const {viewerId} = useParams();
  const {user} = useAuthContext();
  const {remoteCameras} = useStreamContext();

  const dispatch = useStreamDispatchContext();
  
  useEffect(() => {
    const key = `users/${viewerId}/cameras`;
    getItem(key).then(snapshot => {
      snapshot.docs.forEach((document) => {
        dispatch(StreamActionCreator.addRemoteCamera(document as CameraState));
      });
    });

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
          viewerId={viewerId!}
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