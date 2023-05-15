import { FiVolume2, FiVolumeX, FiMic, FiMicOff } from "react-icons/fi";
import React, { useState } from "react";
import { StreamActionCreator, useStreamDispatchContext } from "../contexts/StreamContext";

interface ControlsProps {
  stream: MediaStream | null | undefined
}

export function Controls ({stream}: ControlsProps) {
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(true);
  
  const dispatch = useStreamDispatchContext();

  function onToggleMic () {
    dispatch?.(StreamActionCreator.toggleMuteLocalStream());
  }

  function onToggleSpeaker () {
    // remoteStreams?.forEach(stream => stream.getAudioTracks().forEach(track => track.enabled = !isSpeakerMuted));
    setIsSpeakerMuted(!isSpeakerMuted);
  }

  return <div className="controls">
    <button className="icon-button" onClick={onToggleMic}>
      {stream?.getAudioTracks()[0].enabled
        ? <FiMic className="icon mic" />
        : <FiMicOff className="icon mic" />
      }
    </button>
    <button className="icon-button" onClick={onToggleSpeaker} >
      {isSpeakerMuted
        ? <FiVolumeX className="icon speaker"  />
        : <FiVolume2 className="icon speaker" />
      }
    </button>
    <select className="camera-select">
      <option value="default">default</option>
      <option value="second">second</option>
      <option value="list-of-cameras">list of cameras...</option>
    </select>

  </div>
}