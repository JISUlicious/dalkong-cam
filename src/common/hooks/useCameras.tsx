import { useEffect, useState } from "react";

import { getCameras } from "../functions/getCameras";

interface Cameras {
  [key: string] : MediaDeviceInfo
}

export function useCameras (): Cameras {
  const [cameras, setCameras] = useState<Cameras>({} as Cameras);

  useEffect(() => {
    getCameras().then(cameras => {
      setCameras(cameras);
    });
  }, []);

  return cameras;
}