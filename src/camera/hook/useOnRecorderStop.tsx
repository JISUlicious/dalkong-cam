import { User } from "firebase/auth";
import { useCallback } from "react";
import { DeviceState } from "../../common/contexts/ConnectionContext";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { addItem, storeFile } from "../../common/functions/storage";
import { FirebaseStorage, UploadResult, getDownloadURL, ref } from "firebase/storage";

export function useOnRecorderStop(
  user: User | null,
  localDevice: DeviceState | null,
  ffmpegLoad: Promise<FFmpeg>,
  storage: FirebaseStorage,
) {
  const onRecorderStop = useCallback(async (blob: Blob[], recordingId: number) => {
    if (user && localDevice) {
      const key = `savedVideos/${user.uid}/${localDevice.id}/${recordingId}.mp4`;
      const recordedBlob = new Blob(blob, { type: "video/webm" });
      const sourceBuffer = await recordedBlob.arrayBuffer();
      const ffmpeg = await ffmpegLoad;
      ffmpeg.FS(
        "writeFile",
        `${recordingId}.webm`,
        new Uint8Array(sourceBuffer, 0, sourceBuffer.byteLength)
      );

      await ffmpeg.run('-i', `${recordingId}.webm`, `${recordingId}.mp4`);
      const output = ffmpeg.FS("readFile", `${recordingId}.mp4`);

      return storeFile(key, output, 'video/mp4')
        .then(result => getDownloadURL(ref(storage, result.ref.fullPath))
          .then((url): { url: string, result: UploadResult } => ({ url: url, result: result })))
        .then((res) => {
          const { url, result } = res;
          const key = `users/${user.uid}/savedVideos`;
          const data = {
            fullPath: result.ref.fullPath,
            deviceName: localDevice.data()?.deviceName,
            timestamp: recordingId,
            deviceId: localDevice.id,
            url: url
          };
          return addItem(key, data);
        });
    } else {
      return Promise.reject();
    }
  }, [user, localDevice]);

  return onRecorderStop;
}