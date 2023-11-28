import { useEffect } from "react";
import { getMedia } from "../../common/functions/getMedia";
import { Action, ConnectionActionCreator } from "../../common/contexts/ConnectionContext";

export function useLocalStream(
  localStream: MediaStream | null,
  dispatch: React.Dispatch<Action>,
) {
  useEffect(() => {
    if (!localStream?.active) {
      getMedia().then(localMedia => {
        dispatch(ConnectionActionCreator.setLocalStream(localMedia));
      });
    }
    return (() => {
      dispatch(ConnectionActionCreator.setLocalDevice(null));
      dispatch(ConnectionActionCreator.setLocalStream(null));
    });
  }, []);
}