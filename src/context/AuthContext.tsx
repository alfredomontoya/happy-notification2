import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import {AppState, Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import {UserProfile} from '../database/types';
import {
  getUserById,
  getUserByUsername,
  createAdminUserIfNotExists,
} from '../database/usuarios';

const SESSION_TIMEOUT_MS = 8 * 60 * 60 * 1000;
const LOGIN_TIMESTAMP_KEY = 'loginTimestamp';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({children}: {children: ReactNode}) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createAdminUserIfNotExists();
  }, []);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async firebaseUser => {
      if (firebaseUser) {
        const profile = await getUserById(firebaseUser.uid);
        if (profile) {
          setUser(profile);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', async nextState => {
      if (nextState === 'active') {
        const stored = await AsyncStorage.getItem(LOGIN_TIMESTAMP_KEY);
        if (stored) {
          const elapsed = Date.now() - Number(stored);
          if (elapsed >= SESSION_TIMEOUT_MS) {
            await AsyncStorage.removeItem(LOGIN_TIMESTAMP_KEY);
            Alert.alert(
              'Sesión expirada',
              'Han pasado más de 8 horas desde tu último inicio de sesión. Por favor, inicia sesión nuevamente.',
            );
            await auth().signOut();
            setUser(null);
          }
        }
      }
    });
    return () => sub.remove();
  }, []);

  const login = useCallback(
    async (usernameOrEmail: string, password: string) => {
      let email = usernameOrEmail;
      if (!email.includes('@')) {
        const profile = await getUserByUsername(email);
        if (!profile) {
          throw {code: 'user-not-found'};
        }
        email = profile.email;
      }
      await AsyncStorage.setItem(LOGIN_TIMESTAMP_KEY, String(Date.now()));
      await auth().signInWithEmailAndPassword(email, password);
    },
    [],
  );

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(LOGIN_TIMESTAMP_KEY);
    await auth().signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{user, loading, login, logout}}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
