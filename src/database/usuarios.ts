import {getFirestoreDB, getFunctions} from './firebase';
import type {UserProfile, Permissions} from './types';
import auth from '@react-native-firebase/auth';
import type {FirebaseFirestoreTypes} from '@react-native-firebase/firestore';

async function callFunction(name: string, data: Record<string, any>) {
  const user = auth().currentUser;
  const token = user ? await user.getIdToken(true) : null;
  const cloudFn = getFunctions().httpsCallable(name);
  const result = await cloudFn({...data, __authToken: token});
  return result;
}

const COLLECTION = 'usuarios';

function docRef(uid: string) {
  return getFirestoreDB().collection(COLLECTION).doc(uid);
}

function collectionRef() {
  return getFirestoreDB().collection(COLLECTION);
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const snapshot = await collectionRef().orderBy('nombre', 'asc').get();
  const list: UserProfile[] = [];
  snapshot.forEach((doc: FirebaseFirestoreTypes.DocumentSnapshot) =>
    list.push(doc.data() as UserProfile),
  );
  return list;
}

export async function getUserById(uid: string): Promise<UserProfile | null> {
  const doc = await docRef(uid).get();
  if (!doc.exists) return null;
  return doc.data() as UserProfile;
}

export async function getUserByUsername(
  username: string,
): Promise<UserProfile | null> {
  const snapshot = await collectionRef()
    .where('username', '==', username)
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  return snapshot.docs[0].data() as UserProfile;
}

export async function createUserWithPermissions(
  email: string,
  password: string,
  profile: Omit<UserProfile, 'uid' | 'created_at' | 'created_by'>,
): Promise<string> {
  const result = await callFunction('createUser', {email, password, profile});
  return (result.data as any).uid;
}

export async function updateUserPassword(
  uid: string,
  newPassword: string,
): Promise<void> {
  await callFunction('updateUserPassword', {uid, newPassword});
}

export async function updateUserProfile(
  uid: string,
  data: Partial<Omit<UserProfile, 'uid' | 'created_at' | 'created_by'>>,
): Promise<void> {
  await docRef(uid).update(data);
}

export async function deleteUserProfile(uid: string): Promise<void> {
  // Elimina solo el perfil en Firestore.
  // La cuenta de Auth se puede eliminar manualmente desde la consola de Firebase
  // o mediante una Cloud Function.
  await docRef(uid).delete();
}

export async function createAdminUserIfNotExists(): Promise<void> {
  const snapshot = await collectionRef()
    .where('role', '==', 'admin')
    .limit(1)
    .get();
  if (!snapshot.empty) return;

  try {
    const userCredential = await auth().createUserWithEmailAndPassword(
      'admin@stmsc.gob.bo',
      'admin123',
    );
    const uid = userCredential.user.uid;
    const now = new Date().toISOString();
    const fullPermissions: Permissions = {
      cumpleanios: 'admin',
      funcionarios: 'admin',
      gestiones: 'admin',
      configuracion: 'admin',
      usuarios: 'admin',
    };
    const adminDoc: UserProfile = {
      uid,
      username: 'admin',
      nombre: 'Administrador',
      email: 'admin@stmsc.gob.bo',
      cargo: 'Administrador del Sistema',
      role: 'admin',
      permissions: fullPermissions,
      created_at: now,
      created_by: uid,
    };
    await docRef(uid).set(adminDoc);
  } catch (e: any) {
    if (e.code === 'auth/email-already-in-use') {
      // El admin ya existe en Auth, sincronizar el perfil en Firestore
      const existingSnapshot = await collectionRef()
        .where('email', '==', 'admin@stmsc.gob.bo')
        .limit(1)
        .get();
      if (existingSnapshot.empty) {
        // Iniciar sesión como admin para obtener el UID
        try {
          await auth().signInWithEmailAndPassword(
            'admin@stmsc.gob.bo',
            'admin123',
          );
          const currentUid = auth().currentUser?.uid;
          if (currentUid) {
            const now = new Date().toISOString();
            const fullPermissions: Permissions = {
              cumpleanios: 'admin',
              funcionarios: 'admin',
              gestiones: 'admin',
              configuracion: 'admin',
              usuarios: 'admin',
            };
            const adminDoc: UserProfile = {
              uid: currentUid,
              username: 'admin',
              nombre: 'Administrador',
              email: 'admin@stmsc.gob.bo',
              cargo: 'Administrador del Sistema',
              role: 'admin',
              permissions: fullPermissions,
              created_at: now,
              created_by: currentUid,
            };
            await docRef(currentUid).set(adminDoc);
          }
        } catch {
          console.warn(
            'No se pudo sincronizar el perfil del admin. Inicia sesión manualmente.',
          );
        }
      }
    } else {
      console.warn('Error creating admin user:', e);
    }
  }
}

export async function resetAdminPassword(): Promise<void> {
  await auth().sendPasswordResetEmail('admin@stmsc.gob.bo');
}

export async function resetPassword(
  usernameOrEmail: string,
): Promise<string> {
  let email = usernameOrEmail;
  if (!email.includes('@')) {
    const profile = await getUserByUsername(email);
    if (!profile) {
      throw {code: 'user-not-found'};
    }
    email = profile.email;
  }
  await auth().sendPasswordResetEmail(email);
  return email;
}
