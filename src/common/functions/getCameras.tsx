export async function getCameras () {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras: {[key : string] : MediaDeviceInfo} = {};
    devices.filter(device => device.kind=="videoinput").forEach(camera => cameras[camera.deviceId] = camera);
    return cameras;
  } catch (e) {
    console.log(e);
    return {};
  }
}