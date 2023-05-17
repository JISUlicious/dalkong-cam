import { Dispatch } from "react";
import { Action, ConnectionActionCreator } from "../../common/contexts/ConnectionContext";
import { addItem } from "../../common/functions/storage";
import openRelayTurnServer from "../../turnSettings"

export function useCameraConnection (
  uid: string,
  cameraId: string,
  viewerId: string,
  dispatch: Dispatch<Action>
) {
  const connection = new RTCPeerConnection(openRelayTurnServer);

  connection.onicecandidate = (event) => {
    if (!event.candidate) {
    return;
    }
    const key = `users/${uid}/cameras/${cameraId}/viewers/${viewerId}/answeringCandidates`; 
    addItem(key, event.candidate.toJSON());
  };
  
  connection.ontrack = (event) => {
    const [remoteStream] = event.streams;
    dispatch(ConnectionActionCreator.addRemoteStream(cameraId, remoteStream));
  };

  return connection;
}