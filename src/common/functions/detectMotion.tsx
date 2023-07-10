
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

    for (let i = 0; i < lastImageData.data.length; i += 4) {
      // calculates pixel score for r
      const pixelScore = Math.abs(currentImageData.data[i] - lastImageData.data[i]) / 3; 

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
