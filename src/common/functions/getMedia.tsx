async function getCameras () {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(device => device.kind=="videoinput");
    // move to state or context
    // const currentCamera = localStream.getVideoTracks()[0];
    // cameras.forEach(camera => {
    //   const option = document.createElement("option");
    //   option.value = camera.deviceId;
    //   option.innerText = camera.label;
    //   if (currentCamera.label === camera.label) {
    //     option.selected = true;
    //   }
    //   camerasSelect.appendChild(option);
    // })
    console.log("cameras", cameras);
    return cameras;
  } catch (e) {
    console.log(e);
    return [];
  }
}

export async function getMedia() {
  const constrains = {
    audio: true,
    video: { facingMode: "user"},
  }

  try {
    const localStream = await navigator.mediaDevices.getUserMedia(constrains);
    return localStream;
  } catch (e) {
    throw new Error("Failed to get media");
  }
}