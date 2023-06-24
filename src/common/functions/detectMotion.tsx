
const PIXEL_SCORE_THRESHOLD = 3;
const IMAGE_SCORE_THRESHOLD = 50;

export async function detectMotion (
  context: CanvasRenderingContext2D | null | undefined, 
  ) {
  if (context) {
    context.globalCompositeOperation = 'difference';

    const imageData = context.getImageData(0,0,64,48);
    let imageScore = 0;

    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i] / 3;
      // const g = imageData.data[i + 1] / 3;
      // const b = imageData.data[i + 2] / 3;
      // const pixelScore = r + g + b;
      const pixelScore = r;

      if (pixelScore >= PIXEL_SCORE_THRESHOLD) {
        imageScore++;
      }
    }

    if (imageScore >= IMAGE_SCORE_THRESHOLD) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}

export function timer (time: number) {
  return new Promise(function(resolve){
      setTimeout(function(){
          resolve(time);
      }, time);
  })
}