import { Dispatch, SetStateAction, useEffect, useState } from "react";

import { getCameras } from "../functions/getCameras";

interface Cameras {
  [key: string] : MediaDeviceInfo
}

type UseCameras = [
  Cameras,
  MediaDeviceInfo | undefined, 
  Dispatch<SetStateAction<MediaDeviceInfo | undefined>>
]

export function useCameras (): UseCameras {
  const [cameras, setCameras] = useState<Cameras>({} as Cameras);
  const [currentCamera, setCurrentCamera] = useState<MediaDeviceInfo>();

  useEffect(() => {
    getCameras().then(cameras => {
      setCameras(cameras);
      const deviceId = Object.keys(cameras)[0];
      setCurrentCamera(cameras[deviceId]);
    });
  }, []);

  return [cameras, currentCamera, setCurrentCamera];
}