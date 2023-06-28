import React, { useEffect, useState } from "react";
import { useAuthContext } from "../../common/contexts/AuthContext";
import { getItem } from "../../common/functions/storage";
import { VideoItem } from "../../viewer/components/VideoItem";
import { orderBy } from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "../../common/functions/firebaseInit";


interface VideosData {
  timestamp: number,
  path: string,
  deviceName: string,
  url: string
}

export function History () {
  const [videosData, setVideosData] = useState<Record<string, VideosData>>({});
  const {user} = useAuthContext();
  useEffect(() => {
    if (user) {
      const key = `users/${user.uid}/savedVideos`;
      
      getItem(key, orderBy("timestamp", "desc")).then(snapshot => {
        snapshot.forEach(doc => {
          const docData = doc.data();
          
          getDownloadURL(ref(storage, docData.path+`/${docData.timestamp}`)).then(url => {
            const data = {
              timestamp: docData.timestamp, 
              path: docData.path, 
              deviceName: docData.deviceName,
              url: url
            }
            setVideosData(prev => ({...prev, [doc.id]: data}));
          })
        });
      });
    }
  }, [user]);

  return <div className="history body-content">
    <ul>
      {Object.entries(videosData).map(([id, data]) => {
        return <li key={id}><VideoItem title={String(new Date(data.timestamp))} url={data.url} /></li>;
      })}
    </ul>
  </div>
}