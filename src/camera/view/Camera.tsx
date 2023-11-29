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
import { useCameraDocSubscription } from "../hook/useCameraDocSubscription";
import { useLocalStream } from "../hook/useLocalStream";
import { useLocalDevice } from "../hook/useLocalDevice";


export function Camera() {
  const { user } = useAuthContext();
  const { localDevice, localStream, remoteDevices, connections } = useConnectionContext();
  const dispatch = useConnectionDispatchContext();

  const [isConnectionClosed, setIsConnectionClosed] = useState(false);

  const ffmpegLoad = useMemo(async () => {
    const ffmpeg = createFFmpeg();
    return ffmpeg.load().then(() => ffmpeg);
  }, []);

  const { cameraId } = useParams();

  const videoRef = useRef<HTMLVideoElement>(null);

  const recorder = useMemo(() => {
    if (localStream) {
      return new MediaRecorder(localStream);
    }
  }, [localStream]);

  const onRecorderStop = useCallback(async (blob: Blob[], recordingId: number) => {
    if (user && localDevice) {
      const key = `savedVideos/${user.uid}/${localDevice.id}/${recordingId}.mp4`;
      const recordedBlob = new Blob(blob, { type: "video/webm" });
      const sourceBuffer = await recordedBlob.arrayBuffer();
      const ffmpeg = await ffmpegLoad;
      ffmpeg.FS(
        "writeFile",
        `${recordingId}.webm`,
        new Uint8Array(sourceBuffer, 0, sourceBuffer.byteLength)
      );

      await ffmpeg.run('-i', `${recordingId}.webm`, `${recordingId}.mp4`);
      const output = ffmpeg.FS("readFile", `${recordingId}.mp4`);

      return storeFile(key, output, 'video/mp4')
        .then(result => getDownloadURL(ref(storage, result.ref.fullPath))
          .then(url => [url, result] as [string, UploadResult]))
        .then(([url, result]) => {
          const key = `users/${user.uid}/savedVideos`;
          const data = {
            fullPath: result.ref.fullPath,
            deviceName: localDevice.data()?.deviceName,
            timestamp: recordingId,
            deviceId: localDevice.id,
            url: url
          };
          return addItem(key, data);
        });
    } else {
      return Promise.reject();
    }
  }, [user, localDevice]);

  const isRecording = useRecording(videoRef, recorder, onRecorderStop);

  useEffect(() => {
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
  })

  useEffect(() => {
    if (user && localDevice) {
      getDoc(doc(db, `users/${user.uid}/cameras/${localDevice.id}`))
        .then(doc => {
          const updatedDoc = doc.data()!;
          updatedDoc.isRecording = isRecording;
          return updateItem(`users/${user.uid}/cameras/${localDevice.id}`, updatedDoc);
        })
        .then(() => getDoc(doc(db, `users/${user.uid}/cameras/${cameraId}`)))
        .then(doc => dispatch(ConnectionActionCreator.setLocalDevice(doc as DeviceState)));
    }
  }, [user, !!localDevice, isRecording]);

  useEffect(() => {
    if (localStream) {
      if (!videoRef.current || !localStream)
        return;
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useLocalStream(localStream, dispatch);
  useLocalDevice(user, localDevice, cameraId, db, dispatch);
  useCameraDocSubscription(user, localDevice, localStream, connections, db, dispatch);

  return (isConnectionClosed
    ? <div className="camera body-content container-fluid w-100 px-0">
      <div className="container-fluid px-0 position-relative">
        <div className="row p-5 text-center">
          <div className="fs-5">Connection Closed</div>
        </div>
        <div  className="row p-3 text-center">
          <Link to={'/'}>
            <div className="btn btn-primary px-2 py-1 w-50">
              {'back to Main'}
            </div>
          </Link>
        </div>
      </div>

    </div>
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
    </div>));
}
