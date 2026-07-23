import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification
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

  // ===== ESCUCHAR CAMBIOS DE AUTENTICACIÓN =====
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        console.log('📄 Existe documento de usuario:', userDoc.exists());

        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserRole(data.role);
          setUserData({
            nombre: data.nombre,
            email: data.email,
            telefono: data.telefono,
            role: data.role,
            uid: firebaseUser.uid,
            // Se pueden agregar más campos según necesidad
          });
        } else {
          // Si no existe en Firestore, pero el usuario está autenticado,
          // podría ser un caso de datos incompletos.
          setUserRole(null);
          setUserData(null);
        }
      } else {
        setUserRole(null);
        setUserData(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // ===== REGISTRO =====
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
        emailVerified: false,
        createdAt: new Date().toISOString()
      });

      // Enviar correo de verificación
      await sendEmailVerification(user);

      return {
        success: true,
        uid: user.uid,
        message: 'Registro exitoso. Revisa tu correo para verificar tu cuenta.'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // ===== INICIO DE SESIÓN =====
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Verificar si el email está verificado (opcional, pero recomendado)
      if (!user.emailVerified) {
        // Puedes permitir el login pero mostrar un mensaje, o bloquearlo.
        // Por ahora solo lo advertimos.
        console.warn('⚠️ Email no verificado. El usuario puede continuar pero se recomienda verificar.');
      }

      await updateDoc(doc(db, 'users', user.uid), {
        isOnline: true
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // ===== CIERRE DE SESIÓN =====
  const logout = async () => {
    try {
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          isOnline: false
        });
      }
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // ===== RESTABLECER CONTRASEÑA =====
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return {
        success: true,
        message: 'Correo de restablecimiento enviado. Revisa tu bandeja de entrada.'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // ===== VERIFICAR EMAIL (reenviar) =====
  const verifyEmail = async () => {
    if (!user) {
      return { success: false, error: 'No hay usuario autenticado' };
    }
    try {
      await sendEmailVerification(user);
      return {
        success: true,
        message: 'Correo de verificación enviado. Revisa tu bandeja de entrada.'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // ===== ACTUALIZAR PERFIL DE USUARIO =====
  const updateUserProfile = async (uid, data) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, data);
      // Actualizar estado local si es el mismo usuario
      if (user && user.uid === uid) {
        setUserData(prev => ({ ...prev, ...data }));
      }
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
    logout,
    resetPassword,
    verifyEmail,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};