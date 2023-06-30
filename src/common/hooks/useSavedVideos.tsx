import { Dispatch, useEffect, useState } from "react";
import { VideosData } from "../components/VideosList";
import { useAuthContext } from "../contexts/AuthContext";
import { getItem } from "../functions/storage";
import { QueryConstraint, collection, onSnapshot, query } from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import { db, storage } from "../functions/firebaseInit";


export function useSavedVideos (
  dependency: any = null,
  ...queryConstraints: QueryConstraint[]
  ): [
  Record<string, VideosData>,
  Dispatch<React.SetStateAction<Record<string, VideosData>>>
] {
  const [videosData, setVideosData] = useState<Record<string, VideosData>>({});

  const {user} = useAuthContext();
  useEffect(() => {
    if (user) {
      setVideosData({});
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

      const savedVideosQuery = query(collection(db, key));
      const unsubscribe = onSnapshot(savedVideosQuery, async snapshot => {
        snapshot.docChanges().map(async (change) => {
          const docData = change.doc.data();
          if (change.type === "added") {
            if (!videosData[docData.timestamp]) {
              setVideosData(prev => ({[docData.timestamp]: docData as VideosData, ...prev}));
              getDownloadURL(ref(storage, docData.path+`/${docData.timestamp}`))
              .then(url => {
                setVideosData(prev => ({...prev, [docData.timestamp]: {...docData, url: url}}));
              });
            }
          }
        });
      }, (error) => console.log(error));  
      return () => unsubscribe();
    }
  }, [user, dependency]);


  return [videosData, setVideosData];
}