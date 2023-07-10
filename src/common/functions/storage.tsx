import { 
  doc,
  setDoc,
  getDocs,
  addDoc,
  collection,
  query,
  QuerySnapshot,
  DocumentData,
  deleteDoc,
  updateDoc,
  deleteField,
  QueryConstraint,
} from "firebase/firestore";

import { db, storage } from "./firebaseInit";
import { UploadMetadata, ref, uploadBytes } from "firebase/storage";

export function getItem(
  key: string, 
  ...queryConstraints: QueryConstraint[]
  ): Promise<QuerySnapshot<DocumentData>> {
  return getDocs(query(collection(db, key), ...queryConstraints))
    .then(res => {
      return res;
    });  
}

export function addItem(key: string, value: object, id: string | null = null) {
  if (id) {
    return setDoc(doc(db, key, id), value).then(() => doc(db, key, id));
  }
  return addDoc(collection(db, key), value);
}

export function updateItem(key: string, value: object) {
  return setDoc(doc(db, key), value, {merge: true});
}

export function removeItem(key: string) {
  return deleteDoc(doc(db, key));
}

export function removeItems(key: string) {
  return getDocs(query(collection(db, key)))
  .then(res => Promise.all(res.docs.map(doc => deleteDoc(doc.ref))));
}

export function removeField(key: string, field: string) {
  return updateDoc(doc(db, key), {[field]: deleteField()});
}

// TODO: export function storeFile
export function storeFile(key: string, file: Uint8Array, contentType: string | null = null) {
  return uploadBytes(
    ref(storage, key), 
    file, 
    contentType ? {contentType: contentType} as UploadMetadata : undefined
    );
}

