var admin = require("firebase-admin");

var serviceAccount = require("./firestore_key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore()
const auth = admin.auth()

module.exports = {
    db,
    auth
}