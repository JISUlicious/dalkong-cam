import { Dispatch } from "react";
import openRelayTurnServer from "../../turnSettings";
import { Action, ConnectionActionCreator } from "../../common/contexts/ConnectionContext";
import { addItem } from "../../common/functions/storage";

export async function setCameraConnection (
  uid: string, 
  localDeviceId: string,
  viewerId: string,
  dispatch: Dispatch<Action>
  ) {
  const connection = new RTCPeerConnection(openRelayTurnServer);
  const viewerKey = `users/${uid}/cameras/${localDeviceId}/viewers/${viewerId}`;
  
  connection.onicecandidate = (event) => {
    if (!event.candidate) {
      return;
    }
    const key = `${viewerKey}/answeringCandidates`; 
    addItem(key, event.candidate.toJSON());
  };

  connection.ontrack = (event) => {
    const [remoteStream] = event.streams;
    dispatch(ConnectionActionCreator.addRemoteStream(viewerId, remoteStream));
  };

  return connection;
}