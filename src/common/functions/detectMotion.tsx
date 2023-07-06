
const PIXEL_SCORE_THRESHOLD = 3;
const IMAGE_SCORE_THRESHOLD = 50;

export function detectMotion (
  lastCaptureContext: CanvasRenderingContext2D | null | undefined, 
  currentCaptureContext: CanvasRenderingContext2D | null | undefined, 
  ) {
  if (lastCaptureContext && currentCaptureContext) {
    

    const lastImageData = lastCaptureContext.getImageData(0,0,64,48);
    const currentImageData = currentCaptureContext.getImageData(0,0,64,48);
    let imageScore = 0;

    const difference = lastImageData.data.map((value, index) => {
      return Math.abs(value - currentImageData.data[index])
    })

    for (let i = 0; i < difference.length; i += 4) {
      const r = difference[i] / 3;
      // const g = difference[i + 1] / 3;
      // const b = difference[i + 2] / 3;
      // const pixelScore = r + g + b;
      const pixelScore = r;

      if (pixelScore >= PIXEL_SCORE_THRESHOLD) {
        imageScore++;
      }
    }
    
    console.log(imageScore)
    if (imageScore >= IMAGE_SCORE_THRESHOLD) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}
