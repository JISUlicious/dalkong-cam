import React, { ForwardedRef, forwardRef } from "react"

export const Canvas = forwardRef(function Canvas (
  props,
  canvasRef: ForwardedRef<HTMLCanvasElement>
  ) {
  return <canvas ref={canvasRef} />  
});