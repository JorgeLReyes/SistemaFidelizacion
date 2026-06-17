/**
 * ARCHIVO DE CONFIGURACIÓN CENTRALIZADA DE FIREBASE
 * 
 * Modifica las credenciales de abajo para conectar tu aplicación React
 * directamente con tu base de datos Firestore de producción.
 * Cuando exportes este proyecto, este archivo será el único punto de configuración.
 */
import { FirebaseConfigInput } from './types';

export const FIREBASE_DEFAULT_CONFIG: FirebaseConfigInput = {
  // CONFIGURACIÓN DE TU CONSOLA DE FIREBASE:
  // Se leen a partir de variables de entorno de Vite (VITE_...) para evitar exponer credenciales en repositorios públicos.
  // Si las dejas vacías, la aplicación entrará automáticamente en modo "Simulado / Local".
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};
