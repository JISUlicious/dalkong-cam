/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { setGlobalOptions } from "firebase-functions/v2";

setGlobalOptions({ region: "asia-northeast3" });

import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { StorageEvent, onObjectDeleted } from "firebase-functions/v2/storage";

initializeApp();
const db = getFirestore();

export const deleteDocOnRemovalOfSavedVideo = onObjectDeleted(
  async (cloudEvent: StorageEvent) => {
    console.log(`Event ID: ${cloudEvent.id}`);
    console.log(`Event Type: ${cloudEvent.type}`);

    const file = cloudEvent.data;
    console.log(`Bucket: ${file.bucket}`);
    console.log(`File: ${file.name}`);
    const fileName = file.name;
    const userId = fileName.split("/")[1];

    db.collection(`users/${userId}/savedVideos`)
      .where("fullPath", "==", file.name)
      .get()
      .then((querySnapshot) => {
        console.log("Query executed successfully");
        querySnapshot.forEach((doc) => {
          console.log("target doc", doc.ref.path);
          doc.ref.delete();
        });
      })
      .catch((error) => {
        console.error("Error executing query:", error);
      })
      .finally(() => {
        console.log("Function run finished");
      });
  }
);
