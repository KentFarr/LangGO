const admin = require('firebase-admin');
const serviceAccount = require('./langgo-b66de-firebase-adminsdk-civ88-6a736b6b42.json');


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://langgo-b66de-default-rtdb.firebaseio.com"
    });


module.exports = admin;