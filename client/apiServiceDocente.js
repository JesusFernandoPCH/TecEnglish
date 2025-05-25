import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';

// Usar la misma URL base que el servicio API principal
const API_URL = 'http://192.168.184.223:8080/api';

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor para añadir automáticamente el token a las peticiones
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.log('Error en interceptor de request:', error);
    return Promise.reject(error);
  }
);

// Función para iniciar sesión como docente
export const loginDocente = async (email, password) => {
  try {
    const response = await api.post('/login-docente', { email, password });
    
    // Guardar el token y datos de usuario
    await AsyncStorage.setItem('authToken', response.data.token);
    await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
    await AsyncStorage.setItem('isLoggedIn', 'true');
    
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Función para obtener grupos asignados al docente
export const getGruposDocente = async () => {
  try {
    const response = await api.get('/docente/grupos');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Función para obtener estudiantes de un grupo
export const getEstudiantesGrupo = async (grupoId) => {
  try {
    const response = await api.get(`/docente/grupos/${grupoId}/estudiantes`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Función para actualizar calificación de un estudiante
export const updateCalificacionEstudiante = async (calificacionData) => {
  try {
    const response = await api.post('/docente/calificaciones', calificacionData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Función para exportar calificaciones como Excel
export const exportarCalificaciones = async (grupoId, nombreArchivo) => {
  try {
    // Obtener datos para exportar
    const response = await api.get(`/docente/grupos/${grupoId}/exportar`);
    const calificaciones = response.data;
    
    // Crear libro de Excel con datos
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(calificaciones);
    
    // Añadir hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, "Calificaciones");
    
    // Convertir a binario
    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    
    // Guardar archivo localmente
    const fileName = nombreArchivo || `calificaciones_grupo_${grupoId}.xlsx`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;
    
    await FileSystem.writeAsStringAsync(filePath, wbout, {
      encoding: FileSystem.EncodingType.Base64
    });
    
    // Compartir archivo
    await Sharing.shareAsync(filePath);
    
    return {
      success: true,
      message: 'Archivo exportado correctamente',
      filePath
    };
  } catch (error) {
    if (error.response && error.response.status === 400) {
      throw new Error('No hay calificaciones registradas para este grupo');
    }
    throw handleApiError(error);
  }
};

// Función para manejar errores de API
const handleApiError = (error) => {
  let errorMessage = 'Ha ocurrido un error inesperado';
  
  if (error.response) {
    console.log('Respuesta de error:', error.response.data);
    errorMessage = error.response.data.error || `Error ${error.response.status}`;
    
    if (error.response.status === 401 || error.response.status === 403) {
      AsyncStorage.removeItem('authToken');
      AsyncStorage.removeItem('userData');
      AsyncStorage.removeItem('isLoggedIn');
    }
  } else if (error.request) {
    console.log('No se recibió respuesta:', error.request);
    errorMessage = 'No se pudo conectar con el servidor. Verifica la conexión.';
  }
  
  return new Error(errorMessage);
};