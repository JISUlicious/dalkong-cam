import { QueryConstraint } from "firebase/firestore";
import { VideosData } from "../components/VideosList";
import { useSavedVideos } from "./useSavedVideos";
import { useEffect, useState } from "react";


export function useTimeOrderedVideos (
    ...queryConstraints: QueryConstraint[]
    ): VideosData[] {
    const videosData = useSavedVideos(...queryConstraints);
    const [orderedData, setOrderedData] = useState<VideosData[]>([]);
  
    useEffect(() => {
      const ordered = Object.keys(videosData)
        .sort((curr, next) => videosData[next].timestamp - videosData[curr].timestamp)
        .map((key) => videosData[key]);
      setOrderedData(ordered);
    }, [videosData]);
  
    return orderedData;
  }