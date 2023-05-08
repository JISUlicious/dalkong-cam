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
  camera: CameraState | null,
  user: User | null
  ) {
  useEffect(() => {
    if (!localStream || !localStream?.active) {
      getMedia().then(async (mediaFromDevice) => {
        dispatch?.(StreamActionCreator.setLocalStream(mediaFromDevice));
        mediaFromDevice.getTracks().forEach((track) => {
          connection.addTrack(track, mediaFromDevice)
          connection.getSenders().forEach(sender => console.log(sender.track));
        });
        const offer = await connection.createOffer();
        await connection.setLocalDescription(offer);
        const cameraWithOffer = {
          cameraName: camera?.data()?.cameraName,
          offer: {
          type: offer.type, sdp: offer.sdp
        }};
        
        const key = `users/${user?.uid}/cameras/${camera?.id}`;
        updateItem(key, cameraWithOffer)
          .catch(error => console.log("error", error));
      });
    }
    console.log("connection state", connection.connectionState);
    return () => {
      localStream?.getTracks().forEach((track) => {
        track.stop();
      });
    }
  }, [localStream]);
}