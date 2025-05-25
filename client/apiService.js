import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// IP actualizada según tu configuración de red
const API_URL = 'http://192.168.184.223:8080/api';

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Añadir un timeout para detectar problemas de conexión más rápido
  timeout: 10000,
});

// Interceptor para añadir automáticamente el token a las peticiones
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Enviando solicitud a:', config.url);
    return config;
  },
  (error) => {
    console.log('Error en interceptor de request:', error);
    return Promise.reject(error);
  }
);

// Añadir interceptor de respuesta para depuración
api.interceptors.response.use(
  (response) => {
    console.log('Respuesta recibida correctamente');
    return response;
  },
  (error) => {
    console.log('Error en interceptor de response:', error);
    return Promise.reject(error);
  }
);

// Función para iniciar sesión
export const login = async (noControl, password, isAdmin = false) => {
  try {
    console.log('Intentando login con:', { noControl, password, isAdmin });
    console.log('URL de la API:', API_URL);
    
    const response = await api.post('/login', { noControl, password, isAdmin });
    
    // Guardar el token y datos de usuario
    await AsyncStorage.setItem('authToken', response.data.token);
    await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
    
    return response.data;
  } catch (error) {
    console.log('Error en login:', error);
    throw handleApiError(error);
  }
};

// Función para cerrar sesión
export const logout = async () => {
  try {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userData');
    await AsyncStorage.removeItem('isLoggedIn');
    return true;
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    throw error;
  }
};

// Función para obtener datos del perfil
export const getUserProfile = async () => {
  try {
    const response = await api.get('/profile');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Función para actualizar datos del perfil
export const updateProfile = async (userData) => {
  try {
    const response = await api.put('/profile', userData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Función para cambiar contraseña
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await api.put('/change-password', { currentPassword, newPassword });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Función para obtener posts o anuncios
export const getPosts = async () => {
  try {
    const response = await api.get('/posts');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Función para comprobar si el usuario está autenticado
export const isAuthenticated = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    return !!token;
  } catch (error) {
    console.error('Error verificando autenticación:', error);
    return false;
  }
};

// Función para obtener datos del usuario almacenados localmente
export const getStoredUserData = async () => {
  try {
    const userData = await AsyncStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error obteniendo datos de usuario:', error);
    return null;
  }
};

// Función para manejar errores de API
const handleApiError = (error) => {
  let errorMessage = 'Ha ocurrido un error inesperado';
  
  if (error.response) {
    // Error de respuesta del servidor
    console.log('Respuesta de error:', error.response.data);
    errorMessage = error.response.data.error || `Error ${error.response.status}`;
    
    // Si es un error de autorización (token expirado o inválido)
    if (error.response.status === 401 || error.response.status === 403) {
      // Limpiar datos de sesión
      AsyncStorage.removeItem('authToken');
      AsyncStorage.removeItem('userData');
      AsyncStorage.removeItem('isLoggedIn');
    }
  } else if (error.request) {
    // No se pudo conectar con el servidor
    console.log('No se recibió respuesta:', error.request);
    errorMessage = 'No se pudo conectar con el servidor. Verifica que el servidor esté corriendo en 10.0.0.11:8080';
  }
  
  return new Error(errorMessage);
};