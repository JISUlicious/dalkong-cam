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
  QueryFieldFilterConstraint,
  updateDoc,
  deleteField
} from "firebase/firestore";

import { db, storage } from "./firebaseInit";

export function getItem(key: string, filter?: QueryFieldFilterConstraint): Promise<QuerySnapshot<DocumentData>> {
  if (filter) {
    return getDocs(query(collection(db, key), filter))
    .then(res => {
      return res;
    });  
  } else {
    return getDocs(query(collection(db, key)))
      .then(res => {
        return res;
      });
  }
}

export function addItem(key: string, value: object) {
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
