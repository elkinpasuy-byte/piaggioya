import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userDataFromDb = userDoc.data();
          setUserRole(userDataFromDb.role);
          setUserData({
            nombre: userDataFromDb.nombre,
            email: userDataFromDb.email,
            telefono: userDataFromDb.telefono,
            role: userDataFromDb.role
          });
        }
      } else {
        setUserRole(null);
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const register = async (email, password, nombre, telefono, role) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await setDoc(doc(db, 'users', user.uid), {
  nombre,
  email,
  telefono,
  role,
  isOnline: false,
  createdAt: new Date().toISOString()
});
      
      return {
      success: true,
      uid: user.uid
    };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    await updateDoc(
      doc(db, 'users', userCredential.user.uid),
      {
        isOnline: true
      }
    );

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

 const logout = async () => {
  try {

    if (user) {
      await updateDoc(
        doc(db, 'users', user.uid),
        {
          isOnline: false
        }
      );
    }

    await signOut(auth);

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

  const value = {
    user,
    userData,
    userRole,
    loading,
    register,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};