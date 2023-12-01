export async function getMedia(deviceId: string | null = null) {

  const videoConstraint = deviceId ? { deviceId: { exact: deviceId }, } : { facingMode: "user" };
  const constrains = {
    audio: true,
    video: {
      ...videoConstraint,
      height: { min: 1080, max: 1920 },
      width: { min: 1080, max: 1920 },
      frameRate: { min: 15, ideal: 24, max: 30 },
    },
  };
  try {
    const localStream = await navigator.mediaDevices.getUserMedia(
      constrains
    );

    return localStream;
  } catch (e) {
    throw new Error("Failed to get media");
  }
}