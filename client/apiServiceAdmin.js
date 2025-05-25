import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Función para crear múltiples usuarios en bloque
export const bulkCreateUsers = async (usersData) => {
  try {
    const response = await api.post('/admin/users/bulk', usersData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Función para asignar cursos a múltiples usuarios en bloque
export const bulkAssignCourseToUsers = async (assignmentData) => {
  try {
    const response = await api.post('/admin/bulk-assign-course', assignmentData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Función para eliminar cursos de múltiples usuarios en bloque
export const bulkRemoveCourseFromUsers = async (removalData) => {
  try {
    const response = await api.post('/admin/bulk-remove-course', removalData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Función para obtener lista de docentes
export const getTeacherList = async () => {
  try {
    const response = await api.get('/admin/teachers');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Función para crear un nuevo docente
export const createTeacher = async (teacherData) => {
  try {
    const response = await api.post('/admin/teachers', teacherData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Función para actualizar un docente existente
export const updateTeacher = async (teacherId, teacherData) => {
  try {
    const response = await api.put(`/admin/teachers/${teacherId}`, teacherData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Función para eliminar un docente
export const deleteTeacher = async (teacherId) => {
  try {
    const response = await api.delete(`/admin/teachers/${teacherId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Interceptor para añadir automáticamente el token a las peticiones
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Enviando solicitud admin a:', config.url);
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

// Función para obtener lista de usuarios
export const getUserList = async () => {
  try {
    const response = await api.get('/admin/users');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Función para crear un nuevo usuario
export const createUser = async (userData) => {
  try {
    const response = await api.post('/admin/users', userData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Función para actualizar un usuario existente
export const updateUser = async (userId, userData) => {
  try {
    const response = await api.put(`/admin/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Función para eliminar un usuario
export const deleteUser = async (userId) => {
  try {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Función para obtener lista de cursos
export const getCourseList = async () => {
  try {
    const response = await api.get('/admin/courses');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Función para crear un nuevo curso
export const createCourse = async (courseData) => {
  try {
    const response = await api.post('/admin/courses', courseData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Función para actualizar un curso existente
export const updateCourse = async (courseId, courseData) => {
  try {
    const response = await api.put(`/admin/courses/${courseId}`, courseData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Función para eliminar un curso
export const deleteCourse = async (courseId) => {
  try {
    const response = await api.delete(`/admin/courses/${courseId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Función para obtener lista de exámenes
export const getExamList = async () => {
  try {
    const response = await api.get('/admin/exams');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Función para crear un nuevo examen
export const createExam = async (examData) => {
  try {
    const response = await api.post('/admin/exams', examData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Función para actualizar un examen existente
export const updateExam = async (examId, examData) => {
  try {
    const response = await api.put(`/admin/exams/${examId}`, examData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Función para eliminar un examen
export const deleteExam = async (examId) => {
  try {
    const response = await api.delete(`/admin/exams/${examId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Función para asignar un curso a un usuario
export const assignCourseToUser = async (userId, courseId, courseData) => {
  try {
    const response = await api.post(`/admin/users/${userId}/courses/${courseId}`, courseData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Función para asignar un examen a un usuario
export const assignExamToUser = async (userId, examId, examData) => {
  try {
    const response = await api.post(`/admin/users/${userId}/exams/${examId}`, examData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Función para obtener estadísticas generales
export const getStats = async () => {
  try {
    const response = await api.get('/admin/stats');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Obtener cursos de un usuario específico
export const getUserCourses = async (userId) => {
  try {
    const response = await api.get(`/admin/users/${userId}/courses`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Obtener exámenes de un usuario específico
export const getUserExams = async (userId) => {
  try {
    const response = await api.get(`/admin/users/${userId}/exams`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Actualizar un curso específico de un usuario
export const updateUserCourse = async (userCourseId, courseData) => {
  try {
    const response = await api.put(`/admin/user-courses/${userCourseId}`, courseData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Actualizar un examen específico de un usuario
export const updateUserExam = async (userExamId, examData) => {
  try {
    const response = await api.put(`/admin/user-exams/${userExamId}`, examData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Eliminar un curso específico de un usuario
export const deleteUserCourse = async (userCourseId) => {
  try {
    const response = await api.delete(`/admin/user-courses/${userCourseId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Eliminar un examen específico de un usuario
export const deleteUserExam = async (userExamId) => {
  try {
    const response = await api.delete(`/admin/user-exams/${userExamId}`);
    return response.data;
  } catch (error) {
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

// Función para obtener asignaciones docente-curso
export const getDocenteCursoAssignments = async () => {
  try {
    const response = await api.get('/admin/docente-curso');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Función para crear asignación docente-curso
export const createDocenteCursoAssignment = async (assignmentData) => {
  try {
    const response = await api.post('/admin/docente-curso', assignmentData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Función para actualizar asignación docente-curso
export const updateDocenteCursoAssignment = async (assignmentId, assignmentData) => {
  try {
    const response = await api.put(`/admin/docente-curso/${assignmentId}`, assignmentData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Función para eliminar asignación docente-curso
export const deleteDocenteCursoAssignment = async (assignmentId) => {
  try {
    const response = await api.delete(`/admin/docente-curso/${assignmentId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};