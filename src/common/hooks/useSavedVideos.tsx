import { Dispatch, useEffect, useState } from "react";
import { VideosData } from "../components/VideosList";
import { useAuthContext } from "../contexts/AuthContext";
import { getItem } from "../functions/storage";
import { DocumentData, QueryConstraint, QuerySnapshot } from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "../functions/firebaseInit";


export function useSavedVideos (...queryConstraints:QueryConstraint[]):[
  Record<string, VideosData>,
  Dispatch<React.SetStateAction<Record<string, VideosData>>>
] {
  const [videosData, setVideosData] = useState<Record<string, VideosData>>({});
  const {user} = useAuthContext();
  useEffect(() => {
    if (user) {
      const key = `users/${user.uid}/savedVideos`;
      
      getItem(key, ...queryConstraints).then(snapshot => {
        snapshot.forEach(doc => {
          const docData = doc.data();
          setVideosData(prev => ({...prev, [docData.timestamp]: docData as VideosData}));
          getDownloadURL(ref(storage, docData.path+`/${docData.timestamp}`))
            .then(url => {
              setVideosData(prev => ({...prev, [docData.timestamp]: {...docData, url: url}}));
            });
        });
      });
    }
  }, [user]);


  return [videosData, setVideosData];
}