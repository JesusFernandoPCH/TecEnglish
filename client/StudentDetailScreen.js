import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  getUserCourses, 
  getUserExams, 
  updateUserCourse, 
  updateUserExam,
  deleteUserCourse,
  deleteUserExam
} from './apiServiceAdmin';

const StudentDetailScreen = ({ route, navigation }) => {
  const { userId, userName } = route.params;

  const [userCourses, setUserCourses] = useState([]);
  const [userExams, setUserExams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para modales
  const [isCourseModalVisible, setIsCourseModalVisible] = useState(false);
  const [isExamModalVisible, setIsExamModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  
  // Estados para formularios
  const [courseForm, setCourseForm] = useState({
    CALIFICACION: '',
    ESTADO: 'Pendiente',
    FECHA_INICIO: new Date(),
    FECHA_FIN: null
  });
  
  const [examForm, setExamForm] = useState({
    CALIFICACION: '',
    ESTADO: 'Pendiente',
    FECHA_PROGRAMADA: new Date()
  });
  
  // Estados para selección de fecha
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('startDate'); // 'startDate', 'endDate', 'examDate'

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [coursesData, examsData] = await Promise.all([
        getUserCourses(userId),
        getUserExams(userId)
      ]);
      
      setUserCourses(coursesData);
      setUserExams(examsData);
    } catch (err) {
      console.error('Error al cargar datos del estudiante:', err);
      setError('No se pudieron cargar los datos del estudiante. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Formatear fecha para mostrar
  const formatDate = (dateString) => {
    if (!dateString) return 'No establecida';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  // Mostrar selector de fecha simple
  const showSimpleDatePicker = (mode) => {
    setDatePickerMode(mode);
    setShowDatePicker(true);
  };

  // Generar años para el selector
  const getYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push(i.toString());
    }
    return years;
  };

  // Generar meses para el selector
  const getMonths = () => {
    return [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
  };

  // Generar días para el selector
  const getDays = (month, year) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i.toString());
    }
    return days;
  };

  // Establecer fecha seleccionada
  const setSelectedDate = (day, month, year) => {
    const selectedDate = new Date(year, month, day);
    
    if (datePickerMode === 'startDate') {
      setCourseForm({...courseForm, FECHA_INICIO: selectedDate});
    } else if (datePickerMode === 'endDate') {
      setCourseForm({...courseForm, FECHA_FIN: selectedDate});
    } else if (datePickerMode === 'examDate') {
      setExamForm({...examForm, FECHA_PROGRAMADA: selectedDate});
    }
    
    setShowDatePicker(false);
  };

  // Abrir modal para editar curso
  const handleEditCourse = (course) => {
    setSelectedCourse(course);
    setCourseForm({
      CALIFICACION: course.CALIFICACION ? course.CALIFICACION.toString() : '',
      ESTADO: course.ESTADO || 'Pendiente',
      FECHA_INICIO: course.FECHA_INICIO ? new Date(course.FECHA_INICIO) : new Date(),
      FECHA_FIN: course.FECHA_FIN ? new Date(course.FECHA_FIN) : null
    });
    setIsCourseModalVisible(true);
  };

  // Abrir modal para editar examen
  const handleEditExam = (exam) => {
    setSelectedExam(exam);
    setExamForm({
      CALIFICACION: exam.CALIFICACION ? exam.CALIFICACION.toString() : '',
      ESTADO: exam.ESTADO || 'Pendiente',
      FECHA_PROGRAMADA: exam.FECHA_PROGRAMADA ? new Date(exam.FECHA_PROGRAMADA) : new Date()
    });
    setIsExamModalVisible(true);
  };

  // Eliminar asignación de curso
  const handleDeleteCourse = (course) => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Estás seguro de que deseas eliminar la asignación del curso "${course.NOMBRE_CURSO}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await deleteUserCourse(course.ID);
              // Actualizar lista local
              setUserCourses(userCourses.filter(c => c.ID !== course.ID));
              Alert.alert('Éxito', 'Asignación de curso eliminada correctamente');
            } catch (error) {
              console.error('Error al eliminar asignación:', error);
              Alert.alert('Error', 'No se pudo eliminar la asignación');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  // Eliminar asignación de examen
  const handleDeleteExam = (exam) => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Estás seguro de que deseas eliminar la asignación del examen "${exam.NOMBRE_EXAMEN}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await deleteUserExam(exam.ID);
              // Actualizar lista local
              setUserExams(userExams.filter(e => e.ID !== exam.ID));
              Alert.alert('Éxito', 'Asignación de examen eliminada correctamente');
            } catch (error) {
              console.error('Error al eliminar asignación:', error);
              Alert.alert('Error', 'No se pudo eliminar la asignación');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  // Guardar cambios en curso
  const handleSaveCourse = async () => {
    try {
      setIsLoading(true);
      
      // Validar calificación si se proporciona
      if (courseForm.CALIFICACION && (isNaN(courseForm.CALIFICACION) || 
          parseInt(courseForm.CALIFICACION) < 0 || 
          parseInt(courseForm.CALIFICACION) > 100)) {
        Alert.alert('Error', 'La calificación debe ser un número entre 0 y 100');
        setIsLoading(false);
        return;
      }
      
      // Función para formatear la fecha a YYYY-MM-DD
      const formatDateForDB = (dateObj) => {
        if (!dateObj) return null;
        const date = new Date(dateObj);
        return date.toISOString().split('T')[0];
      };
      
      // Preparar datos para enviar
      const updatedCourseData = {
        CALIFICACION: courseForm.CALIFICACION ? parseInt(courseForm.CALIFICACION) : null,
        ESTADO: courseForm.ESTADO,
        FECHA_INICIO: formatDateForDB(courseForm.FECHA_INICIO),
        FECHA_FIN: formatDateForDB(courseForm.FECHA_FIN)
      };
      
      // Actualizar en el servidor
      const updatedCourse = await updateUserCourse(selectedCourse.ID, updatedCourseData);
      
      // Actualizar el estado local
      setUserCourses(userCourses.map(course => 
        course.ID === selectedCourse.ID ? updatedCourse : course
      ));
      
      // Cerrar modal
      setIsCourseModalVisible(false);
      Alert.alert('Éxito', 'Curso actualizado correctamente');
    } catch (err) {
      console.error('Error al actualizar curso:', err);
      Alert.alert('Error', 'No se pudo actualizar el curso. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Guardar cambios en examen
  const handleSaveExam = async () => {
    try {
      setIsLoading(true);
      
      // Validar calificación si se proporciona
      if (examForm.CALIFICACION && (isNaN(examForm.CALIFICACION) || 
          parseInt(examForm.CALIFICACION) < 0 || 
          parseInt(examForm.CALIFICACION) > 100)) {
        Alert.alert('Error', 'La calificación debe ser un número entre 0 y 100');
        setIsLoading(false);
        return;
      }
      
      // Función para formatear la fecha a YYYY-MM-DD
      const formatDateForDB = (dateObj) => {
        if (!dateObj) return null;
        const date = new Date(dateObj);
        return date.toISOString().split('T')[0];
      };
      
      // Preparar datos para enviar
      const updatedExamData = {
        CALIFICACION: examForm.CALIFICACION ? parseInt(examForm.CALIFICACION) : null,
        ESTADO: examForm.ESTADO,
        FECHA_PROGRAMADA: formatDateForDB(examForm.FECHA_PROGRAMADA)
      };
      
      // Actualizar en el servidor
      const updatedExam = await updateUserExam(selectedExam.ID, updatedExamData);
      
      // Actualizar el estado local
      setUserExams(userExams.map(exam => 
        exam.ID === selectedExam.ID ? updatedExam : exam
      ));
      
      // Cerrar modal
      setIsExamModalVisible(false);
      Alert.alert('Éxito', 'Examen actualizado correctamente');
    } catch (err) {
      console.error('Error al actualizar examen:', err);
      Alert.alert('Error', 'No se pudo actualizar el examen. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Renderizar selector de fecha simple
  const renderSimpleDatePicker = () => {
    let date;
    let title;
    
    if (datePickerMode === 'startDate') {
      date = courseForm.FECHA_INICIO || new Date();
      title = 'Seleccionar fecha de inicio';
    } else if (datePickerMode === 'endDate') {
      date = courseForm.FECHA_FIN || new Date();
      title = 'Seleccionar fecha de fin';
    } else {
      date = examForm.FECHA_PROGRAMADA || new Date();
      title = 'Seleccionar fecha programada';
    }
    
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    
    const years = getYears();
    const months = getMonths();
    const days = getDays(month, year);
    
    return (
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.datePickerModalContainer}>
          <View style={styles.datePickerModalContent}>
            <Text style={styles.datePickerTitle}>{title}</Text>
            
            <View style={styles.datePickerControls}>
              {/* Selector de día */}
              <View style={styles.datePickerColumn}>
                <Text style={styles.datePickerLabel}>Día</Text>
                <ScrollView style={styles.datePickerScrollView}>
                  {days.map((d) => (
                    <TouchableOpacity
                      key={`day-${d}`}
                      style={[
                        styles.datePickerItem,
                        parseInt(d) === day ? styles.datePickerItemSelected : {}
                      ]}
                      onPress={() => setSelectedDate(parseInt(d), month, year)}
                    >
                      <Text 
                        style={[
                          styles.datePickerItemText,
                          parseInt(d) === day ? styles.datePickerItemTextSelected : {}
                        ]}
                      >
                        {d}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              {/* Selector de mes */}
              <View style={styles.datePickerColumn}>
                <Text style={styles.datePickerLabel}>Mes</Text>
                <ScrollView style={styles.datePickerScrollView}>
                  {months.map((m, index) => (
                    <TouchableOpacity
                      key={`month-${index}`}
                      style={[
                        styles.datePickerItem,
                        index === month ? styles.datePickerItemSelected : {}
                      ]}
                      onPress={() => setSelectedDate(day, index, year)}
                    >
                      <Text 
                        style={[
                          styles.datePickerItemText,
                          index === month ? styles.datePickerItemTextSelected : {}
                        ]}
                      >
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              {/* Selector de año */}
              <View style={styles.datePickerColumn}>
                <Text style={styles.datePickerLabel}>Año</Text>
                <ScrollView style={styles.datePickerScrollView}>
                  {years.map((y) => (
                    <TouchableOpacity
                      key={`year-${y}`}
                      style={[
                        styles.datePickerItem,
                        parseInt(y) === year ? styles.datePickerItemSelected : {}
                      ]}
                      onPress={() => setSelectedDate(day, month, parseInt(y))}
                    >
                      <Text 
                        style={[
                          styles.datePickerItemText,
                          parseInt(y) === year ? styles.datePickerItemTextSelected : {}
                        ]}
                      >
                        {y}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            
            <View style={styles.datePickerButtons}>
              <TouchableOpacity
                style={[styles.datePickerButton, styles.datePickerCancelButton]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.datePickerCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Renderizar indicador de carga
  if (isLoading && !userCourses.length && !userExams.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Cargando datos del estudiante...</Text>
      </View>
    );
  }

  // Renderizar mensaje de error
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={60} color="#FF5252" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={loadUserData}
        >
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6C63FF', '#4158D0']}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestión de Estudiante</Text>
      </LinearGradient>
      
      <View style={styles.studentInfoContainer}>
        <MaterialIcons name="person" size={36} color="#6C63FF" style={styles.studentIcon} />
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{userName}</Text>
          <Text style={styles.studentId}>ID: {userId}</Text>
        </View>
      </View>
      
      <ScrollView style={styles.contentContainer}>
        {/* Sección de cursos */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="school" size={24} color="#6C63FF" />
            <Text style={styles.sectionTitle}>Cursos Asignados</Text>
          </View>
          
          {userCourses.length === 0 ? (
            <Text style={styles.noDataText}>No hay cursos asignados</Text>
          ) : (
            userCourses.map(course => (
              <View key={`course-${course.ID}`} style={styles.itemCard}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle}>{course.NOMBRE_CURSO}</Text>
                  <View style={styles.itemDetail}>
                    <Text style={styles.itemLabel}>Estado:</Text>
                    <Text style={[
                      styles.itemValue,
                      course.ESTADO === 'Completado' ? styles.statusCompleted :
                      course.ESTADO === 'En curso' ? styles.statusInProgress : 
                      styles.statusPending
                    ]}>
                      {course.ESTADO || 'Pendiente'}
                    </Text>
                  </View>
                  <View style={styles.itemDetail}>
                    <Text style={styles.itemLabel}>Calificación:</Text>
                    <Text style={styles.itemValue}>
                      {course.CALIFICACION !== null ? course.CALIFICACION : 'No calificado'}
                    </Text>
                  </View>
                  <View style={styles.itemDetail}>
                    <Text style={styles.itemLabel}>Fecha inicio:</Text>
                    <Text style={styles.itemValue}>
                      {course.FECHA_INICIO ? formatDate(course.FECHA_INICIO) : 'No establecida'}
                    </Text>
                  </View>
                  <View style={styles.itemDetail}>
                    <Text style={styles.itemLabel}>Fecha fin:</Text>
                    <Text style={styles.itemValue}>
                      {course.FECHA_FIN ? formatDate(course.FECHA_FIN) : 'No establecida'}
                    </Text>
                  </View>
                </View>
                <View style={styles.itemActions}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => handleEditCourse(course)}
                  >
                    <MaterialIcons name="edit" size={20} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteCourse(course)}
                  >
                    <MaterialIcons name="delete" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
        
        {/* Sección de exámenes */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="assignment" size={24} color="#6C63FF" />
            <Text style={styles.sectionTitle}>Exámenes Asignados</Text>
          </View>
          
          {userExams.length === 0 ? (
            <Text style={styles.noDataText}>No hay exámenes asignados</Text>
          ) : (
            userExams.map(exam => (
              <View key={`exam-${exam.ID}`} style={styles.itemCard}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle}>{exam.NOMBRE_EXAMEN}</Text>
                  <View style={styles.itemDetail}>
                    <Text style={styles.itemLabel}>Estado:</Text>
                    <Text style={[
                      styles.itemValue,
                      exam.ESTADO === 'Completado' ? styles.statusCompleted :
                      exam.ESTADO === 'Programado' ? styles.statusScheduled : 
                      styles.statusPending
                    ]}>
                      {exam.ESTADO || 'Pendiente'}
                    </Text>
                  </View>
                  <View style={styles.itemDetail}>
                    <Text style={styles.itemLabel}>Calificación:</Text>
                    <Text style={styles.itemValue}>
                      {exam.CALIFICACION !== null ? exam.CALIFICACION : 'No calificado'}
                    </Text>
                  </View>
                  <View style={styles.itemDetail}>
                    <Text style={styles.itemLabel}>Fecha programada:</Text>
                    <Text style={styles.itemValue}>
                      {exam.FECHA_PROGRAMADA ? formatDate(exam.FECHA_PROGRAMADA) : 'No establecida'}
                    </Text>
                  </View>
                </View>
                <View style={styles.itemActions}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => handleEditExam(exam)}
                  >
                    <MaterialIcons name="edit" size={20} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteExam(exam)}
                  >
                    <MaterialIcons name="delete" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
      
      {/* Modal para editar curso */}
      <Modal
        visible={isCourseModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCourseModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Curso</Text>
            
            {selectedCourse && (
              <Text style={styles.modalSubtitle}>{selectedCourse.NOMBRE_CURSO}</Text>
            )}
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Estado</Text>
              <View style={styles.pickerContainer}>
                <TouchableOpacity 
                  style={[
                    styles.statusOption, 
                    courseForm.ESTADO === 'Pendiente' && styles.statusOptionSelected
                  ]}
                  onPress={() => setCourseForm({...courseForm, ESTADO: 'Pendiente'})}
                >
                  <Text style={[
                    styles.statusOptionText, 
                    courseForm.ESTADO === 'Pendiente' && styles.statusOptionTextSelected
                  ]}>Pendiente</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.statusOption, 
                    courseForm.ESTADO === 'En curso' && styles.statusOptionSelected
                  ]}
                  onPress={() => setCourseForm({...courseForm, ESTADO: 'En curso'})}
                >
                  <Text style={[
                    styles.statusOptionText, 
                    courseForm.ESTADO === 'En curso' && styles.statusOptionTextSelected
                  ]}>En curso</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.statusOption, 
                    courseForm.ESTADO === 'Completado' && styles.statusOptionSelected
                  ]}
                  onPress={() => setCourseForm({...courseForm, ESTADO: 'Completado'})}
                >
                  <Text style={[
                    styles.statusOptionText, 
                    courseForm.ESTADO === 'Completado' && styles.statusOptionTextSelected
                  ]}>Completado</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Calificación</Text>
              <TextInput
                style={styles.formInput}
                value={courseForm.CALIFICACION}
                onChangeText={(text) => setCourseForm({...courseForm, CALIFICACION: text})}
                placeholder="Calificación (0-100)"
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Fecha de Inicio</Text>
              <TouchableOpacity 
                style={styles.dateInput}
                onPress={() => showSimpleDatePicker('startDate')}
              >
                <Text>
                  {courseForm.FECHA_INICIO ? formatDate(courseForm.FECHA_INICIO) : 'Seleccionar fecha'}
                </Text>
                <MaterialIcons name="date-range" size={22} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Fecha de Fin</Text>
              <TouchableOpacity 
                style={styles.dateInput}
                onPress={() => showSimpleDatePicker('endDate')}
              >
                <Text>
                  {courseForm.FECHA_FIN ? formatDate(courseForm.FECHA_FIN) : 'Seleccionar fecha'}
                </Text>
                <MaterialIcons name="date-range" size={22} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setIsCourseModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={handleSaveCourse}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Modal para editar examen */}
      <Modal
        visible={isExamModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsExamModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Examen</Text>
            
            {selectedExam && (
              <Text style={styles.modalSubtitle}>{selectedExam.NOMBRE_EXAMEN}</Text>
            )}
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Estado</Text>
              <View style={styles.pickerContainer}>
                <TouchableOpacity 
                  style={[
                    styles.statusOption, 
                    examForm.ESTADO === 'Pendiente' && styles.statusOptionSelected
                  ]}
                  onPress={() => setExamForm({...examForm, ESTADO: 'Pendiente'})}
                >
                  <Text style={[
                    styles.statusOptionText, 
                    examForm.ESTADO === 'Pendiente' && styles.statusOptionTextSelected
                  ]}>Pendiente</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.statusOption, 
                    examForm.ESTADO === 'Programado' && styles.statusOptionSelected
                  ]}
                  onPress={() => setExamForm({...examForm, ESTADO: 'Programado'})}
                >
                  <Text style={[
                    styles.statusOptionText, 
                    examForm.ESTADO === 'Programado' && styles.statusOptionTextSelected
                  ]}>Programado</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.statusOption, 
                    examForm.ESTADO === 'Completado' && styles.statusOptionSelected
                  ]}
                  onPress={() => setExamForm({...examForm, ESTADO: 'Completado'})}
                >
                  <Text style={[
                    styles.statusOptionText, 
                    examForm.ESTADO === 'Completado' && styles.statusOptionTextSelected
                  ]}>Completado</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Calificación</Text>
              <TextInput
                style={styles.formInput}
                value={examForm.CALIFICACION}
                onChangeText={(text) => setExamForm({...examForm, CALIFICACION: text})}
                placeholder="Calificación (0-100)"
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Fecha Programada</Text>
              <TouchableOpacity 
                style={styles.dateInput}
                onPress={() => showSimpleDatePicker('examDate')}
              >
                <Text>
                  {examForm.FECHA_PROGRAMADA ? formatDate(examForm.FECHA_PROGRAMADA) : 'Seleccionar fecha'}
                </Text>
                <MaterialIcons name="date-range" size={22} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setIsExamModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={handleSaveExam}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Renderizar el selector de fecha simple */}
      {showDatePicker && renderSimpleDatePicker()}
      
      {/* Loader overlay */}
      {isLoading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#6C63FF" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 15,
    paddingHorizontal: 15,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 15,
    fontSize: 16,
    color: '#FF5252',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  studentInfoContainer: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  studentIcon: {
    backgroundColor: '#f0f0ff',
    padding: 10,
    borderRadius: 30,
    marginRight: 15,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  studentId: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  contentContainer: {
    flex: 1,
    padding: 15,
  },
  sectionContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    padding: 10,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  itemDetail: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  itemLabel: {
    fontSize: 14,
    color: '#666',
    width: 120,
  },
  itemValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  statusCompleted: {
    color: '#4CAF50',
  },
  statusInProgress: {
    color: '#2196F3',
  },
  statusPending: {
    color: '#FFC107',
  },
  statusScheduled: {
    color: '#FF9800',
  },
  itemActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  editButton: {
    backgroundColor: '#6C63FF',
  },
  deleteButton: {
    backgroundColor: '#FF5252',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 15,
  },
  formLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    fontWeight: '500',
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginHorizontal: 2,
    borderRadius: 6,
  },
  statusOptionSelected: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  statusOptionText: {
    fontSize: 14,
    color: '#666',
  },
  statusOptionTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#6C63FF',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Estilos para el selector de fecha personalizado
  datePickerModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  datePickerModalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  datePickerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  datePickerColumn: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  datePickerLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  datePickerScrollView: {
    height: 150,
    width: '100%',
  },
  datePickerItem: {
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  datePickerItemSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  datePickerItemText: {
    fontSize: 16,
    color: '#333',
  },
  datePickerItemTextSelected: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  datePickerButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  datePickerCancelButton: {
    backgroundColor: '#e0e0e0',
  },
  datePickerCancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  }
});

export default StudentDetailScreen;