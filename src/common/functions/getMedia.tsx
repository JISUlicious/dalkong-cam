export async function getMedia(deviceId: string | null = null) {

  const constrains = {
    audio: true,
    video: deviceId ? {deviceId : {exact: deviceId},} : { facingMode: "user"},
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