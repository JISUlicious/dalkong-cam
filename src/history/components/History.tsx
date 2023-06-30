import React from "react";
import { VideosList } from "../../common/components/VideosList";
import { useSavedVideos } from "../../common/hooks/useSavedVideos";
import { orderBy } from "firebase/firestore";

export function History () {
  const [videosData, setVideosData] = useSavedVideos(null, orderBy("timestamp", "desc"));

  return <div className="history body-content">
    <VideosList videos={videosData} />
  </div>
}