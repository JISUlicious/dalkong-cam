import { Dispatch } from "react";

import { Action, ConnectionActionCreator, DeviceState } from "../contexts/ConnectionContext";

import { addItem, updateItem } from "./storage";

import openRelayTurnServer from "../../turnSettings";

export function getConnection (
  localDeviceType: string,
  sdpType: "offer" | "answer",
  connectionKey: string, 
  action: {type: "addRemoteDevice", device: DeviceState}, 
  dispatch: Dispatch<Action>,
  localStream: MediaStream | null
): RTCPeerConnection {

  const connection = new RTCPeerConnection(openRelayTurnServer);
    
  connection.onicecandidate = (event) => {
    if (!event.candidate) {
      return;
    }
    addItem(connectionKey + `/${sdpType}ingCandidates`, event.candidate.toJSON());
  };

  connection.ontrack = (event) => {
    const [remoteStream] = event.streams;
    dispatch(ConnectionActionCreator.addRemoteStream(action.device.id, remoteStream));
  };

  if (localDeviceType === "viewer") {
    localStream?.getTracks().forEach(track => {
      connection.addTrack(track, localStream);
    });
    connection.createOffer().then(offer => {
      connection.setLocalDescription(offer).catch(error => console.log(error));
      const viewerWithOffer = {
        offer: {
          type: offer.type,
          sdp: offer.sdp
        }
      };
      updateItem(connectionKey, viewerWithOffer);

      return connection;
    });
  }
  return connection;
}