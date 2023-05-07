import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Stream } from "../../common/components/Stream";
import { StreamActionCreator, useStreamDispatchContext } from "../../common/contexts/StreamContext";
import { addItem, getItem, updateItem } from "../../common/functions/storage";
import { documentId, where } from "firebase/firestore";

interface CameraItemProps {
  title: string,
  viewerId: string,
  cameraId: string,
  stream: MediaStream | null | undefined
}

export function CameraItem({title, viewerId, cameraId, stream}: CameraItemProps) {
  const navigate = useNavigate();
  function onClick () {
    navigate(`/viewer/${viewerId}/camera/${cameraId}`); // TODO: make route
  }
  
  return (<div className="camera-item" onClick={onClick}>
    <h1>{title}</h1>
    <Stream stream={stream} />
  </div>);
}