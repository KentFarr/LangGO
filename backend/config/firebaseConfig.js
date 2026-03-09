const admin = require('firebase-admin');

// Prefer loading credentials from environment for security; fall back to
// local JSON when not configured (e.g. during local development).
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

let credential;

if (serviceAccountJson) {
  try {
    const parsed = JSON.parse(serviceAccountJson);
    credential = admin.credential.cert(parsed);
  } catch (err) {
    throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT JSON provided');
  }
} else {
  // eslint-disable-next-line global-require, import/no-dynamic-require
  const serviceAccount = require('./langgo-b66de-firebase-adminsdk-civ88-6a736b6b42.json');
  credential = admin.credential.cert(serviceAccount);
}

admin.initializeApp({
  credential,
  databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://langgo-b66de-default-rtdb.firebaseio.com',
});

module.exports = admin;