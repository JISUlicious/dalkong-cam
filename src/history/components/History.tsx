import React from "react";
import { VideosList } from "../../common/components/VideosList";
import { useTimeOrderedVideos } from "../../common/hooks/useTimeOrderedVideos";

export function History () {
  const videosData = useTimeOrderedVideos();

  return <div className="history body-content">
    <VideosList videos={videosData} />
  </div>
}