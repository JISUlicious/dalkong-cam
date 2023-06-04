import { Action, ConnectionActionCreator, DeviceState } from "../../common/contexts/ConnectionContext";
import { Dispatch } from "react";
import { addItem, updateItem } from "../../common/functions/storage";
import openRelayTurnServer from "../../turnSettings";

export async function setViewerConnection (
  cameraDoc: DeviceState, 
  uid: string, 
  dispatch: Dispatch<Action>, 
  localDevice: DeviceState,
  localStream: MediaStream
  ) {

  dispatch(ConnectionActionCreator.addRemoteDevice(cameraDoc as DeviceState));

  const connection = new RTCPeerConnection(openRelayTurnServer);

  connection.onicecandidate = (event) => {
    if (!event.candidate) {
    return;
    }
    const key = `users/${uid}/cameras/${cameraDoc.id}/viewers/${localDevice.id}/offeringCandidates`; 
    addItem(key, event.candidate.toJSON());
  };
  
  connection.ontrack = (event) => {
    const [remoteStream] = event.streams;
    dispatch(ConnectionActionCreator.addRemoteStream(cameraDoc.id, remoteStream));
  };
  
  dispatch(ConnectionActionCreator.addConnection(cameraDoc.id, connection));

  localStream.getTracks().forEach(track => connection.addTrack(track, localStream));
  const offer = await connection.createOffer();
  await connection.setLocalDescription(offer).catch(error => console.log(error));

  const viewerWithOffer = {
    offer: {
      type: offer.type,
      sdp: offer.sdp
    }
  };
  const viewerKey = `users/${uid}/cameras/${cameraDoc.id}/viewers/${localDevice.id}`;
  
  updateItem(viewerKey, viewerWithOffer);
  return connection;
}