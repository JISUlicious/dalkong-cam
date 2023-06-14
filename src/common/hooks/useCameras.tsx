import { Dispatch, SetStateAction, useEffect, useState } from "react";

import { getCameras } from "../functions/getCameras";

type UseCameras = [
  MediaDeviceInfo[], 
  MediaDeviceInfo | undefined, 
  Dispatch<SetStateAction<MediaDeviceInfo | undefined>>
]

export function useCameras (): UseCameras {
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCamera, setCurrentCamera] = useState<MediaDeviceInfo>();

  useEffect(() => {
    getCameras().then(cameras => {
      setCameras(cameras);
      setCurrentCamera(cameras[0]);
    });
  }, []);

  return [cameras, currentCamera, setCurrentCamera];
}