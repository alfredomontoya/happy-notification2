const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d).{6,}$/;

function validatePassword(password) {
  if (!password || password.length < 6) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'La contraseña debe tener al menos 6 caracteres',
    );
  }
  if (!PASSWORD_REGEX.test(password)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'La contraseña debe contener al menos una letra y un número',
    );
  }
}

async function resolveAuth(req) {
  if (req.auth && req.auth.uid) {
    return {uid: req.auth.uid};
  }

  const rawToken = req.data && req.data.__authToken;
  if (rawToken) {
    try {
      const decoded = await admin.auth().verifyIdToken(rawToken);
      return {uid: decoded.uid, token: decoded};
    } catch (e) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Token de autenticación inválido',
      );
    }
  }

  throw new functions.https.HttpsError(
    'unauthenticated',
    'Debes iniciar sesión',
  );
}

function getPayload(req) {
  return req.data || req;
}

async function getCallerProfile(uid) {
  const doc = await admin
    .firestore()
    .collection('usuarios')
    .doc(uid)
    .get();
  return doc.data();
}

exports.updateUserPassword = functions.https.onCall(async req => {
  const payload = getPayload(req);
  const auth = await resolveAuth(req);

  const callerProfile = await getCallerProfile(auth.uid);

  if (!callerProfile || callerProfile.role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Solo administradores pueden cambiar contraseñas',
    );
  }

  const {uid, newPassword} = payload;

  if (!uid || !newPassword) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Faltan datos requeridos',
    );
  }

  validatePassword(newPassword);

  await admin.auth().updateUser(uid, {password: newPassword});

  return {success: true};
});

exports.createUser = functions.https.onCall(async req => {
  const payload = getPayload(req);
  const auth = await resolveAuth(req);

  const callerProfile = await getCallerProfile(auth.uid);

  if (!callerProfile || callerProfile.role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Solo administradores pueden crear usuarios',
    );
  }

  const {email, password, profile} = payload;

  if (!email || !password || !profile) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Faltan datos requeridos',
    );
  }

  validatePassword(password);

  const userRecord = await admin.auth().createUser({
    email,
    password,
  });

  const uid = userRecord.uid;
  const now = new Date().toISOString();

  const userDoc = {
    uid,
    ...profile,
    email,
    created_at: now,
    created_by: auth.uid,
  };

  await admin.firestore().collection('usuarios').doc(uid).set(userDoc);

  return {uid, success: true};
});
