import { Dispatch } from "react";

import { Action, ConnectionActionCreator, DeviceState } from "../contexts/ConnectionContext";

import { addItem, updateItem } from "./storage";

export function getConnection (
  localDevice: DeviceState,
  sdpType: "offer" | "answer",
  connectionKey: string, 
  action: {type: "addRemoteDevice", device: DeviceState}, 
  dispatch: Dispatch<Action>,
  localStream: MediaStream | null
): RTCPeerConnection {
  const openRelayTurnServer: RTCConfiguration = JSON.parse(process.env.REACT_APP_TURN_SERVER!);
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

  if (localDevice.data()?.deviceType === "viewer") {
    localStream?.getTracks().forEach(track => {
      connection.addTrack(track, localStream);
    });
    connection.createOffer().then(offer => {
      connection.setLocalDescription(offer).catch(error => console.log(error));
      const viewerWithOffer = {
        offer: {
          type: offer.type,
          sdp: offer.sdp
        },
        deviceType: "viewer",
        deviceName: localDevice.data()?.deviceName
      };
      updateItem(connectionKey, viewerWithOffer);

      return connection;
    });
  }
  return connection;
}