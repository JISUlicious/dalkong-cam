import { db, storage } from "./firebaseInit";
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
  QueryConstraint,
  QueryCompositeFilterConstraint,
  QueryFieldFilterConstraint
} from "firebase/firestore";



/**
 *
 * @param key firestore path to collection
 * @param defaultValue
 * @param filter firestore query constrain
 * @returns {Promise<QuerySnapshot<DocumentData>>}
 */

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

/**
 *
 * @param key firestore firestore path to collection
 * @param value
 * @returns {Promise<DocumentReference<DocumentData>>}
 */

export function addItem(key: string, value: object) {
  return addDoc(collection(db, key), value);
}

/**
 *
 * @param key firestore path to document
 * @param value
 * @returns {Promise<void>}
 */
export function updateItem(key: string, value: object) {
  return setDoc(doc(db, key), value, {merge: true});
}

/**
 *
 * @param key firestore path to document
 * @returns {Promise<void>}
 */
export function removeItem(key: string) {
  console.log("removeItem");
  return deleteDoc(doc(db, key));
}

/**
 *
 * @param key firestore path to collection
 * @returns {Promise<void>}
 */
export function removeItems(key: string) {
  console.log(removeItems);
  return getDocs(query(collection(db, key)))
  .then(res => res.docs.forEach(doc => deleteDoc(doc.ref)));
}

// TODO: export function storeFile
