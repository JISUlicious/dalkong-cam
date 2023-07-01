import { Dispatch, MutableRefObject, useEffect, useRef, useState } from "react";
import { VideosData } from "../components/VideosList";
import { useAuthContext } from "../contexts/AuthContext";
import { getItem } from "../functions/storage";
import { DocumentData, QueryConstraint, collection, onSnapshot, query } from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import { db, storage } from "../functions/firebaseInit";


export function useSavedVideos (
  ...queryConstraints: QueryConstraint[]
  ): [
  Record<string, VideosData>,
  Dispatch<React.SetStateAction<Record<string, VideosData>>>
] {
  const [videosData, setVideosData] = useState<Record<string, VideosData>>({});
  const videosDataRef = useRef(videosData);
  const {user} = useAuthContext();

  useEffect(() => {
    if (user) {
      videosDataRef.current = {};
      const key = `users/${user.uid}/savedVideos`;

      const savedVideosQuery = query(collection(db, key), ...queryConstraints);
      const unsubscribe = onSnapshot(savedVideosQuery, async snapshot => {
        snapshot.docChanges().map(async (change) => {
          const docData = change.doc.data();
          if (change.type === "added") {
            if (!videosDataRef.current[docData.timestamp]) {
              videosDataRef.current = {
                [docData.timestamp]: docData as VideosData,
                ...videosDataRef.current,
              };
              setVideosData(videosDataRef.current);
              getDownloadURL(ref(storage, docData.path+`/${docData.timestamp}`))
                .then(url => {
                  videosDataRef.current = {
                    ...videosDataRef.current,
                    [docData.timestamp]: {
                      ...videosDataRef.current[docData.timestamp], 
                      url: url
                    }, 
                  };
                  setVideosData(videosDataRef.current);
                });
            }
          }
        });
      }, (error) => console.log(error));  
      return () => unsubscribe();
    }
  }, [user]);

  return [videosData, setVideosData];
}