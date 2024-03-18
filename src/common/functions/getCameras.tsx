export async function getCameras () {
  try {
    console.log(navigator)
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras: {[key : string] : MediaDeviceInfo} = {};
    console.log(devices)
    devices.filter(device => device.kind=="videoinput").forEach(camera => cameras[camera.deviceId] = camera);
    return cameras;
  } catch (e) {
    console.log(e);
    return {};
  }
}