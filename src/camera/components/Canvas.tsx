import React, { useRef } from 'react'

export function Canvas (stream: MediaStream) {
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvas = canvasRef.current;
  const context = canvas?.getContext('2d');
  // context?.drawImage(stream.getVideoTracks()[0], 0, 0, 64, 48);

  
  return <canvas ref={canvasRef}/>
}

export default Canvas