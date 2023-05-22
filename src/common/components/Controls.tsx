import React from "react";
import { FiVolume2, FiVolumeX, FiMic, FiMicOff } from "react-icons/fi";

import { useConnectionContext } from "../contexts/ConnectionContext";

interface ControlsProps {
  stream: MediaStream | null | undefined
}

export function Controls ({stream}: ControlsProps) {
  const {localStream} = useConnectionContext();

  function onToggleMic () {
    localStream?.getAudioTracks().forEach(track => track.enabled = !track.enabled);
  }

  function onToggleSpeaker () {
    stream?.getAudioTracks().forEach(track => track.enabled = !track.enabled);
  }

  return <div className="controls">
    <button className="icon-button" onClick={onToggleMic}>
      {localStream?.getAudioTracks()[0].enabled
        ? <FiMic className="icon mic" />
        : <FiMicOff className="icon mic" />
      }
    </button>
    <button className="icon-button" onClick={onToggleSpeaker}>
      {stream?.getAudioTracks()[0].enabled
        ? <FiVolume2 className="icon speaker" />
        : <FiVolumeX className="icon speaker" />
      }
    </button>
    <select className="camera-select">
      <option value="default">default</option>
      <option value="second">second</option>
      <option value="list-of-cameras">list of cameras...</option>
    </select>

  </div>
}