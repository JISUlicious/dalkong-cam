import React, { Dispatch, useEffect } from "react";
import { Action, CameraState, StreamActionCreator, useStreamContext } from "../contexts/StreamContext";
import { getMedia } from "../functions/getMedia";
import { User } from "firebase/auth";
import { updateItem } from "../functions/storage";

type LocalStream = MediaStream | null;

export function useLocalStream(
  localStream: LocalStream,
  dispatch: Dispatch<Action>,
  connection: RTCPeerConnection,
  camera: CameraState | undefined,
  user: User | null
  ) {
  useEffect(() => {
    if (!localStream || !localStream?.active) {getMedia().then((mediaFromDevice) => {
      dispatch?.(StreamActionCreator.setLocalStream(mediaFromDevice));
      mediaFromDevice.getTracks().forEach(track => connection.addTrack(track, mediaFromDevice));
      connection.createOffer().then(offer => {
        connection.setLocalDescription(offer);
        return {
          cameraName: camera?.data()?.cameraName,
          offer: {
          type: offer.type, sdp: offer.sdp
        }};
      }).then(cameraWithOffer => {
        const key = `users/${user?.uid}/cameras/${camera?.id}`;
        updateItem(key, cameraWithOffer)
          .then(docRef => console.log("docRef", docRef))
          .catch(error => console.log("error", error));
      });
    });
    }
    return () => {
      localStream?.getTracks().forEach((track) => {
        track.stop();
      });
    }
  }, [localStream]);
}