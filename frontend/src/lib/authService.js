import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut,
  updateProfile 
} from 'firebase/auth';
import { auth, googleProvider } from './firebaseConfig';
import apiClient from './apiClient';

// Register with email and password
export const registerWithEmail = async (email, password, name) => {
  try {
    // Register on backend first (creates user with hashed password + JWT)
    const response = await apiClient.post('/auth/register', { email, password, name });
    
    // Also create Firebase user for consistent auth state
    try {
      const firebaseCred = await createUserWithEmailAndPassword(auth, email, password);
      if (name) {
        await updateProfile(firebaseCred.user, { displayName: name });
      }
    } catch (fbErr) {
      // Firebase account creation is supplementary; non-critical if fails
      console.warn('Firebase signup supplementary error (non-critical):', fbErr.code);
    }
    
    // Store token and user
    const { token, user } = response.data;
    localStorage.setItem('astrovedic_token', token);
    localStorage.setItem('astrovedic_user', JSON.stringify(user));
    
    return { success: true, user, token, redirect: response.data.redirect || '/onboarding' };
  } catch (error) {
    const message = error.response?.data?.detail || error.message || 'Registration failed';
    throw new Error(message);
  }
};

// Login with email and password
export const loginWithEmail = async (email, password) => {
  try {
    // Login on backend
    const response = await apiClient.post('/auth/login', { email, password });
    
    // Also sign in to Firebase for consistent auth state
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (fbErr) {
      console.warn('Firebase login supplementary error (non-critical):', fbErr.code);
    }
    
    // Store token and user
    const { token, user, redirect } = response.data;
    localStorage.setItem('astrovedic_token', token);
    localStorage.setItem('astrovedic_user', JSON.stringify(user));
    
    // If admin, also store admin auth for backward compat with AdminLayout
    if (user.role === 'admin' || user.role === 'SUPER_ADMIN') {
      localStorage.setItem('admin_auth', JSON.stringify(user));
    }
    
    return { success: true, user, token, redirect: redirect || '/dashboard' };
  } catch (error) {
    const message = error.response?.data?.detail || error.message || 'Login failed';
    throw new Error(message);
  }
};

// Login with Google
export const loginWithGoogle = async () => {
  try {
    // Firebase Google popup
    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;
    
    // Send to backend for JWT
    const response = await apiClient.post('/auth/google', {
      firebase_token: await firebaseUser.getIdToken(),
      email: firebaseUser.email,
      name: firebaseUser.displayName || '',
      photo_url: firebaseUser.photoURL || '',
    });
    
    // Store token and user
    const { token, user, redirect } = response.data;
    localStorage.setItem('astrovedic_token', token);
    localStorage.setItem('astrovedic_user', JSON.stringify(user));
    
    if (user.role === 'admin' || user.role === 'SUPER_ADMIN') {
      localStorage.setItem('admin_auth', JSON.stringify(user));
    }
    
    return { success: true, user, token, redirect: redirect || '/dashboard' };
  } catch (error) {
    const message = error.response?.data?.detail || error.message || 'Google sign-in failed';
    throw new Error(message);
  }
};

// Logout
export const logout = async () => {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Firebase signout error:', err);
  }
  localStorage.removeItem('astrovedic_token');
  localStorage.removeItem('astrovedic_user');
  localStorage.removeItem('admin_auth');
};

// Get stored user
export const getStoredUser = () => {
  try {
    const userStr = localStorage.getItem('astrovedic_user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

// Get stored token
export const getStoredToken = () => {
  return localStorage.getItem('astrovedic_token');
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getStoredToken() && !!getStoredUser();
};

// Check if user is admin
export const isAdmin = () => {
  const user = getStoredUser();
  return user?.role === 'admin' || user?.role === 'SUPER_ADMIN';
};

// Refresh user data from backend
export const refreshUserData = async () => {
  try {
    const response = await apiClient.get('/auth/me');
    const user = response.data.user;
    localStorage.setItem('astrovedic_user', JSON.stringify(user));
    return user;
  } catch {
    return null;
  }
};
