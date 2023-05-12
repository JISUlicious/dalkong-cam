import { useMemo } from "react";
import openRelayTurnServer from "../../turnSettings";
import { addItem } from "../functions/storage";

export function useRTCConnection (uid: string | undefined, cameraId: string | undefined) {
  const connection = useMemo(() => {
    const connection = new RTCPeerConnection(openRelayTurnServer);

    connection.onicecandidate = (event) => {
      if (!event.candidate) {
        return;
      }
      const key = `users/${uid}/cameras/${cameraId}/offeringCandidates`; 
      addItem(key, event.candidate.toJSON());
    };
  
    connection.ontrack = (event) => {
      console.log("track event", event);

    };

    return connection;
  }, []);
  return connection;
}