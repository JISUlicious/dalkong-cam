import {FiVolume2, FiVolumeX, FiMic, FiMicOff} from "react-icons/fi";
import {useState} from "react";

export function Controls () {
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);

  function onToggleMic () {
    setIsMicMuted(!isMicMuted);
    // mic off
  }

  function onToggleSpeaker () {
    setIsSpeakerMuted(!isSpeakerMuted);
    // speaker off
  }

  return <div className="controls">
    <button className="icon-button" onClick={onToggleMic}>
      {isMicMuted
        ? <FiMicOff className="icon mic" />
        : <FiMic className="icon mic" />
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