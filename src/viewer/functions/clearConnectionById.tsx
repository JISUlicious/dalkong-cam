import { Dispatch } from "react";
import { Action, ConnectionActionCreator } from "../../common/contexts/ConnectionContext";
import { Subscriptions } from "../components/Viewer";

export async function clearConnectionById (
  id: string, 
  subscriptions: Subscriptions,
  setSubscriptions: Dispatch<React.SetStateAction<Subscriptions>>,
  dispatch: Dispatch<Action>
  ) {
  console.log(subscriptions[id]);
  subscriptions[id].unsubDescriptions();
  subscriptions[id].unsubICECandidates();

  delete subscriptions[id];
  setSubscriptions({...subscriptions});

  dispatch(ConnectionActionCreator.removeRemoteStream(id));
  dispatch(ConnectionActionCreator.removeRemoteDevice(id));
  dispatch(ConnectionActionCreator.removeConnection(id));
}