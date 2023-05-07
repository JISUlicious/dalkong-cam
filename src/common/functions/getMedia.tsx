
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