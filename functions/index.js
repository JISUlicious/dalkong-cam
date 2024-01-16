const functions = require('@google-cloud/functions-framework');
// The Firebase Admin SDK to access Firestore.
const admin = require("firebase-admin");
// const {deleteDoc, doc} = require("firebase-admin/firestore");

admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

// Register a CloudEvent callback with the Functions Framework that will
// be triggered by Cloud Storage.
functions.cloudEvent('deleteDocOnRemovalOfStorageFile', (cloudEvent) => {
  
  console.log(`Event ID: ${cloudEvent.id}`);
  console.log(`Event Type: ${cloudEvent.type}`);

  const file = cloudEvent.data;
  console.log(`Bucket: ${file.bucket}`);
  console.log(`File: ${file.name}`);
  console.log(`Metageneration: ${file.metageneration}`);
  console.log(`Created: ${file.timeCreated}`);
  console.log(`Updated: ${file.updated}`);
  const fileName = file.name;
  const userId = fileName.split('/')[1];

  // db.collectionGroup('savedVideos')
  //   .where('fullPath', '==', file.name)
  //   .get()
  //   .then((querySnapshot) => {
  //     console.log('Query executed successfully');
  //     querySnapshot.forEach(doc => {
  //       console.log("target doc", doc.ref.path);
  //       // deleteDoc(doc(db, doc.ref.path));
  //       doc.ref.delete();
  //     });
  //   })
  //   .catch((error) => {
  //     console.error('Error executing query:', error);
  //   });

  db.collection(`users/${userId}/savedVideos`)
    .where('fullPath', '==', file.name)
    .get()
    .then((querySnapshot) => {
      console.log('Query executed successfully');
      querySnapshot.forEach(doc => {
        console.log("target doc", doc.ref.path);
        doc.ref.delete();
      });
    })
    .catch((error) => {
      console.error('Error executing query:', error);
    });

});

