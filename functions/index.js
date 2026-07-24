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

async function resolveAuth(arg) {
  if (arg.auth) return arg.auth;

  const rawToken = arg.data && arg.data.__authToken;
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

exports.updateUserPassword = functions.https.onCall(async arg => {
  const auth = await resolveAuth(arg);
  const {data} = arg;

  const callerDoc = await admin
    .firestore()
    .collection('usuarios')
    .doc(auth.uid)
    .get();
  const callerProfile = callerDoc.data();

  if (!callerProfile || callerProfile.role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Solo administradores pueden cambiar contraseñas',
    );
  }

  const {uid, newPassword} = data;

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

exports.createUser = functions.https.onCall(async arg => {
  const auth = await resolveAuth(arg);
  const {data} = arg;

  const callerDoc = await admin
    .firestore()
    .collection('usuarios')
    .doc(auth.uid)
    .get();
  const callerProfile = callerDoc.data();

  if (!callerProfile || callerProfile.role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Solo administradores pueden crear usuarios',
    );
  }

  const {email, password, profile} = data;

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
