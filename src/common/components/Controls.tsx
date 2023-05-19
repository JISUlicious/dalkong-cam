import React, { useState } from "react";
import { FiVolume2, FiVolumeX, FiMic, FiMicOff } from "react-icons/fi";

import { ConnectionActionCreator, useConnectionDispatchContext } from "../contexts/ConnectionContext";

interface ControlsProps {
  stream: MediaStream | null | undefined
}

export function Controls ({stream}: ControlsProps) {
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(true);
  
  const dispatch = useConnectionDispatchContext();

  function onToggleMic () {
    dispatch?.(ConnectionActionCreator.toggleMuteMic());
  }

  function onToggleSpeaker () {
    stream?.getAudioTracks().forEach(track => track.enabled = !track.enabled);
  }

  return <div className="controls">
    <button className="icon-button" onClick={onToggleMic}>
      {stream?.getAudioTracks()[0].enabled
        ? <FiMic className="icon mic" />
        : <FiMicOff className="icon mic" />
      }
    </button>
    <select className="camera-select">
      <option value="default">default</option>
      <option value="second">second</option>
      <option value="list-of-cameras">list of cameras...</option>
    </select>

  </div>
}