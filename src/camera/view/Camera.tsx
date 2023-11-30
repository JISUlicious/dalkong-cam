import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

import { AudioItem } from "../components/AudioItem";

import { useAuthContext } from "../../common/contexts/AuthContext";
import {
  ConnectionActionCreator,
  DeviceState,
  useConnectionContext,
  useConnectionDispatchContext
} from "../../common/contexts/ConnectionContext";

import { db, storage } from "../../common/functions/firebaseInit";
import { Link, useParams } from "react-router-dom";
import { addItem, storeFile, updateItem } from "../../common/functions/storage";
import { StreamWithControls } from "../../common/components/StreamWithControls";

import { useRecording } from "../../common/hooks/useRecording";
import { UploadResult, getDownloadURL, ref } from "firebase/storage";
import { createFFmpeg } from "@ffmpeg/ffmpeg";
import { useViewersCollectionSubscription } from "../hook/useViewersCollectionSubscription";
import { useLocalStream } from "../hook/useLocalStream";
import { useLocalDevice } from "../hook/useLocalDevice";
import { useUpdateCameraDoc } from "../hook/useUpdateCameraDoc";
import { useOnRecorderStop } from "../hook/useOnRecorderStop";


export function Camera() {
  const { user } = useAuthContext();
  const { localDevice, localStream, remoteDevices, connections } = useConnectionContext();
  const dispatch = useConnectionDispatchContext();

  const [isConnectionClosed, setIsConnectionClosed] = useState(false);

  const { cameraId } = useParams();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const ffmpegLoad = useMemo(async () => {
    const ffmpeg = createFFmpeg();
    return ffmpeg.load().then(() => ffmpeg);
  }, []);
  
  const recorder = useMemo(() => {
    if (localStream) {
      return new MediaRecorder(localStream);
    }
  }, [localStream]);
  
  const onRecorderStop = useOnRecorderStop(user, localDevice, ffmpegLoad, storage);

  const isRecording = useRecording(videoRef, recorder, onRecorderStop);

  useEffect(() => {
    // when camera removed from viewer
    if (user && localDevice) {
      const key = `users/${user.uid}/cameras/${localDevice.id}`;
      const unsubscribeCameraDoc = onSnapshot(doc(db, key), async (snapshot) => {
        if (!snapshot.exists()) {
          dispatch(ConnectionActionCreator.setLocalDevice(null));
          setIsConnectionClosed(true);
        }
      })
      return (() => unsubscribeCameraDoc());
    }
  });

  useEffect(() => {
    if (localStream) {
      if (!videoRef.current || !localStream)
        return;
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useLocalStream(localStream, dispatch);
  useLocalDevice(user, localDevice, cameraId, db, dispatch);
  useUpdateCameraDoc(user, localDevice, db, isRecording, dispatch);
  useViewersCollectionSubscription(user, localDevice, localStream, connections, db, dispatch);

  return (isConnectionClosed
    ? (<div className="camera body-content container-fluid w-100 px-0">
      <div className="container-fluid px-0 position-relative">
        <div className="row p-5 text-center">
          <div className="fs-5">Connection Closed</div>
        </div>
        <div className="row p-3 text-center">
          <Link to={'/'}>
            <div className="btn btn-primary px-2 py-1 w-50">
              {'back to Main'}
            </div>
          </Link>
        </div>
      </div>
    </div>)
    : (<div className="camera body-content container-fluid w-100 px-0">
      <div className="stream container-fluid px-0 position-relative">
        <StreamWithControls ref={videoRef} device={localDevice} muted={true} />
        <div className="remote-media position-absolute bottom-0 row mx-0 p-1 justify-content-center w-100">
          {Object.entries(remoteDevices).map(([id, viewer]) => {
            return (<div key={id} className="col-auto px-1">
              <AudioItem viewer={viewer} />
            </div>);
          })}
          <div className="col-auto d-flex flex-grow-1">
            <div className="container-fluid text-white text-end fs-6">
              {localDevice?.data()?.deviceName}
            </div>
          </div>
        </div>
      </div>
    </div>)
  );
}
