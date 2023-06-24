

const PIXEL_SCORE_THRESHOLD = 3;
const IMAGE_SCORE_THRESHOLD = 50;

export function capture(
  context: CanvasRenderingContext2D | null | undefined, 
  video: HTMLVideoElement | null
  ) {

  if (context && video) {
    context?.drawImage(video, 0, 0, 64, 48);    
  }
}

export async function detectMotion (
  context: CanvasRenderingContext2D | null | undefined, 
  // recording: boolean, 
  // dispatch: Dispatch<Action>
  ) {
  if (context) {
    // console.log("detecting motion");
    context.globalCompositeOperation = 'difference';

    const imageData = context.getImageData(0,0,64,48);
    // console.log("Image Data",imageData);
    let imageScore = 0;

    for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i] / 3;
        const g = imageData.data[i + 1] / 3;
        const b = imageData.data[i + 2] / 3;
        // const pixelScore = r + g + b;
        const pixelScore = r;

        // console.log("pixel score", pixelScore);
        if (pixelScore >= PIXEL_SCORE_THRESHOLD) {
          imageScore++;
        }
    }

    if (imageScore >= IMAGE_SCORE_THRESHOLD) { // && recording===false) {
      // we have motion!
      console.log("motion detected", new Date(), "Image Score", imageScore);
      // dispatch(ConnectionActionCreator.setLocalStreamAttribute({}));
      // let newDiv = await createDivForSavedVideo();
      // savedVideos.prepend(newDiv);
      // inMotion = false;
      return true;
    } else {
      console.log("Image Score",imageScore);
      return false;
    }
  }
  // do other stuff
}

export async function detectMotionFromStream (
  canvas: HTMLCanvasElement | null,
  context: CanvasRenderingContext2D | null | undefined, 
  video: HTMLVideoElement | null
) {
  // console.log("detecting motion from stream",new Date());

  capture(context, video);
  console.log("first capture")
  await timer(5000);
  capture(context, video);
  const recorded = await detectMotion(context);

  context?.clearRect(0, 0, canvas!.width, canvas!.height);
  console.log("second capture")
  await timer(5000);
  console.log("recorded", recorded, "detectMotion stdby",new Date());
  // console.log("===========================================");
  return true;
}

export function timer (time: number) {
  return new Promise(function(resolve){
      setTimeout(function(){
          resolve(time);
      }, time);
  })
}