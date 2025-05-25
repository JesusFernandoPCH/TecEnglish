import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  getTeacherList, 
  getCourseList,
  getDocenteCursoAssignments,
  createDocenteCursoAssignment,
  updateDocenteCursoAssignment,
  deleteDocenteCursoAssignment
} from './apiServiceAdmin';

const DocenteCursoManagement = ({ navigation }) => {
  const [assignments, setAssignments] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' o 'edit'
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [assignmentForm, setAssignmentForm] = useState({
    ID_DOCENTE: '',
    ID_NIVEL_CURSO: '',
    GRUPO: '',
    PERIODO: '',
    FECHA_INICIO: new Date().toISOString().split('T')[0],
    FECHA_FIN: ''
  });
  const [isTeacherListVisible, setIsTeacherListVisible] = useState(false);
  const [isCourseListVisible, setIsCourseListVisible] = useState(false);
  
  useEffect(() => {
    loadData();
  }, []);
  
  useEffect(() => {
    if (searchText) {
      const filtered = assignments.filter(assignment => 
        (assignment.NOMBRE_DOCENTE && assignment.NOMBRE_DOCENTE.toLowerCase().includes(searchText.toLowerCase())) ||
        (assignment.APELLIDO_DOCENTE && assignment.APELLIDO_DOCENTE.toLowerCase().includes(searchText.toLowerCase())) ||
        (assignment.NOMBRE_CURSO && assignment.NOMBRE_CURSO.toLowerCase().includes(searchText.toLowerCase())) ||
        (assignment.GRUPO && assignment.GRUPO.toLowerCase().includes(searchText.toLowerCase())) ||
        (assignment.PERIODO && assignment.PERIODO.toLowerCase().includes(searchText.toLowerCase()))
      );
      setFilteredAssignments(filtered);
    } else {
      setFilteredAssignments(assignments);
    }
  }, [searchText, assignments]);
  
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [assignmentsList, teachersList, coursesList] = await Promise.all([
        getDocenteCursoAssignments(),
        getTeacherList(),
        getCourseList()
      ]);
      
      setAssignments(assignmentsList);
      setFilteredAssignments(assignmentsList);
      setTeachers(teachersList);
      setCourses(coursesList);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCreateAssignment = () => {
    setModalMode('create');
    setSelectedAssignment(null);
    setSelectedTeacher(null);
    setSelectedCourse(null);
    setAssignmentForm({
      ID_DOCENTE: '',
      ID_NIVEL_CURSO: '',
      GRUPO: '',
      PERIODO: '',
      FECHA_INICIO: new Date().toISOString().split('T')[0],
      FECHA_FIN: ''
    });
    setIsModalVisible(true);
  };
  
  const handleEditAssignment = (assignment) => {
    setModalMode('edit');
    setSelectedAssignment(assignment);
    
    // Encontrar el docente y el curso correspondiente
    const teacher = teachers.find(t => t.ID === assignment.ID_DOCENTE);
    const course = courses.find(c => c.ID === assignment.ID_NIVEL_CURSO);
    
    setSelectedTeacher(teacher);
    setSelectedCourse(course);
    
    setAssignmentForm({
      ID_DOCENTE: assignment.ID_DOCENTE,
      ID_NIVEL_CURSO: assignment.ID_NIVEL_CURSO,
      GRUPO: assignment.GRUPO,
      PERIODO: assignment.PERIODO,
      FECHA_INICIO: assignment.FECHA_INICIO || '',
      FECHA_FIN: assignment.FECHA_FIN || ''
    });
    
    setIsModalVisible(true);
  };
  
  const handleDeleteAssignment = (assignment) => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Estás seguro de que deseas eliminar la asignación del curso "${assignment.NOMBRE_CURSO}" al docente "${assignment.NOMBRE_DOCENTE} ${assignment.APELLIDO_DOCENTE}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await deleteDocenteCursoAssignment(assignment.ID);
              // Actualizar lista local
              const updatedAssignments = assignments.filter(a => a.ID !== assignment.ID);
              setAssignments(updatedAssignments);
              setFilteredAssignments(updatedAssignments);
              Alert.alert('Éxito', 'Asignación eliminada correctamente');
            } catch (error) {
              console.error('Error al eliminar asignación:', error);
              
              // Si el error contiene una pregunta de confirmación
              if (error.message && error.message.includes('¿Está seguro')) {
                Alert.alert(
                  'Advertencia',
                  error.message,
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { 
                      text: 'Eliminar de todos modos', 
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await deleteDocenteCursoAssignment(assignment.ID);
                          const updatedAssignments = assignments.filter(a => a.ID !== assignment.ID);
                          setAssignments(updatedAssignments);
                          setFilteredAssignments(updatedAssignments);
                          Alert.alert('Éxito', 'Asignación eliminada correctamente');
                        } catch (innerError) {
                          Alert.alert('Error', 'No se pudo eliminar la asignación');
                        } finally {
                          setIsLoading(false);
                        }
                      }
                    }
                  ]
                );
              } else {
                Alert.alert('Error', 'No se pudo eliminar la asignación');
              }
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };
  
  const handleSubmitAssignment = async () => {
    // Validar formulario
    if (!assignmentForm.ID_DOCENTE || !assignmentForm.ID_NIVEL_CURSO || 
        !assignmentForm.GRUPO || !assignmentForm.PERIODO) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }
    
    try {
      setIsLoading(true);
      
      if (modalMode === 'create') {
        // Crear asignación
        const newAssignment = await createDocenteCursoAssignment(assignmentForm);
        setAssignments([...assignments, newAssignment]);
        Alert.alert('Éxito', 'Asignación creada correctamente');
      } else {
        // Actualizar asignación
        const updatedAssignment = await updateDocenteCursoAssignment(selectedAssignment.ID, assignmentForm);
        const updatedAssignments = assignments.map(assignment => 
          assignment.ID === selectedAssignment.ID ? updatedAssignment : assignment
        );
        setAssignments(updatedAssignments);
        Alert.alert('Éxito', 'Asignación actualizada correctamente');
      }
      
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error al guardar asignación:', error);
      Alert.alert('Error', error.message || 'No se pudo guardar la asignación');
    } finally {
      setIsLoading(false);
    }
  };
  
  const selectTeacher = (teacher) => {
    setSelectedTeacher(teacher);
    setAssignmentForm({...assignmentForm, ID_DOCENTE: teacher.ID});
    setIsTeacherListVisible(false);
  };
  
  const selectCourse = (course) => {
    setSelectedCourse(course);
    setAssignmentForm({...assignmentForm, ID_NIVEL_CURSO: course.ID});
    setIsCourseListVisible(false);
  };
  
  const renderAssignmentItem = ({ item }) => (
    <View style={styles.assignmentCard}>
      <View style={styles.assignmentInfo}>
        <View style={styles.assignmentHeader}>
          <Text style={styles.courseName}>{item.NOMBRE_CURSO}</Text>
          <View style={styles.groupBadge}>
            <Text style={styles.groupText}>Grupo: {item.GRUPO}</Text>
          </View>
        </View>
        
        <Text style={styles.teacherName}>
          Docente: {item.NOMBRE_DOCENTE} {item.APELLIDO_DOCENTE}
        </Text>
        
        <Text style={styles.periodText}>
          Periodo: {item.PERIODO}
        </Text>
        
        <View style={styles.dateRow}>
          <Text style={styles.dateText}>
            Inicio: {item.FECHA_INICIO ? new Date(item.FECHA_INICIO).toLocaleDateString() : 'No establecida'}
          </Text>
          <Text style={styles.dateText}>
            Fin: {item.FECHA_FIN ? new Date(item.FECHA_FIN).toLocaleDateString() : 'No establecida'}
          </Text>
        </View>
      </View>
      
      <View style={styles.assignmentActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditAssignment(item)}
        >
          <MaterialIcons name="edit" size={20} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteAssignment(item)}
        >
          <MaterialIcons name="delete" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
  
  // Modal para seleccionar docente
  const renderTeacherSelectionModal = () => (
    <Modal
      visible={isTeacherListVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setIsTeacherListVisible(false)}
    >
      <View style={styles.selectionModalContainer}>
        <View style={styles.selectionModalContent}>
          <Text style={styles.selectionModalTitle}>Seleccionar Docente</Text>
          
          <TextInput
            style={styles.selectionSearchInput}
            placeholder="Buscar docente..."
            value={searchText}
            onChangeText={setSearchText}
          />
          
          <FlatList
            data={teachers.filter(teacher => 
              searchText ? 
                (teacher.NOMBRE + ' ' + teacher.APELLIDO).toLowerCase().includes(searchText.toLowerCase()) :
                true
            )}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.selectionItem}
                onPress={() => selectTeacher(item)}
              >
                <Text style={styles.selectionItemText}>
                  {item.NOMBRE} {item.APELLIDO}
                </Text>
                <Text style={styles.selectionItemSubtext}>
                  {item.EMAIL}
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={item => item.ID.toString()}
            style={styles.selectionList}
          />
          
          <TouchableOpacity
            style={styles.selectionCloseButton}
            onPress={() => setIsTeacherListVisible(false)}
          >
            <Text style={styles.selectionCloseButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
  
  // Modal para seleccionar curso
  const renderCourseSelectionModal = () => (
    <Modal
      visible={isCourseListVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setIsCourseListVisible(false)}
    >
      <View style={styles.selectionModalContainer}>
        <View style={styles.selectionModalContent}>
          <Text style={styles.selectionModalTitle}>Seleccionar Curso</Text>
          
          <TextInput
            style={styles.selectionSearchInput}
            placeholder="Buscar curso..."
            value={searchText}
            onChangeText={setSearchText}
          />
          
          <FlatList
            data={courses.filter(course => 
              searchText ? 
                course.NOMBRE.toLowerCase().includes(searchText.toLowerCase()) :
                true
            )}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.selectionItem}
                onPress={() => selectCourse(item)}
              >
                <Text style={styles.selectionItemText}>
                  {item.NOMBRE}
                </Text>
                <Text style={styles.selectionItemSubtext}>
                  {item.DESCRIPCION}
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={item => item.ID.toString()}
            style={styles.selectionList}
          />
          
          <TouchableOpacity
            style={styles.selectionCloseButton}
            onPress={() => setIsCourseListVisible(false)}
          >
            <Text style={styles.selectionCloseButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
  
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
        <Text style={styles.headerTitle}>Asignación de Cursos a Docentes</Text>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={24} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por docente o curso..."
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <MaterialIcons name="clear" size={24} color="#666" />
            </TouchableOpacity>
          ) : null}
        </View>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleCreateAssignment}
        >
          <MaterialIcons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {isLoading && assignments.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>Cargando asignaciones...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredAssignments}
          renderItem={renderAssignmentItem}
          keyExtractor={item => item.ID.toString()}
          contentContainerStyle={styles.assignmentList}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {searchText 
                ? 'No se encontraron asignaciones con ese criterio' 
                : 'No hay asignaciones registradas'}
            </Text>
          }
        />
      )}

      {/* Modal para crear/editar asignación */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {modalMode === 'create' ? 'Nueva Asignación' : 'Editar Asignación'}
            </Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Docente *</Text>
              <TouchableOpacity 
                style={styles.pickerButton}
                onPress={() => setIsTeacherListVisible(true)}
              >
                <Text style={selectedTeacher ? styles.pickerSelectedText : styles.pickerPlaceholder}>
                  {selectedTeacher 
                    ? `${selectedTeacher.NOMBRE} ${selectedTeacher.APELLIDO}` 
                    : 'Seleccionar Docente'}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Curso *</Text>
              <TouchableOpacity 
                style={styles.pickerButton}
                onPress={() => setIsCourseListVisible(true)}
              >
                <Text style={selectedCourse ? styles.pickerSelectedText : styles.pickerPlaceholder}>
                  {selectedCourse 
                    ? selectedCourse.NOMBRE 
                    : 'Seleccionar Curso'}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Grupo *</Text>
              <TextInput
                style={styles.formInput}
                value={assignmentForm.GRUPO}
                onChangeText={(text) => setAssignmentForm({...assignmentForm, GRUPO: text})}
                placeholder="Ej: A, B, C, Grupo-1, etc."
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Periodo *</Text>
              <TextInput
                style={styles.formInput}
                value={assignmentForm.PERIODO}
                onChangeText={(text) => setAssignmentForm({...assignmentForm, PERIODO: text})}
                placeholder="Ej: 2025-1, Semestre 1-2025, etc."
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Fecha de Inicio</Text>
              <TextInput
                style={styles.formInput}
                value={assignmentForm.FECHA_INICIO}
                onChangeText={(text) => setAssignmentForm({...assignmentForm, FECHA_INICIO: text})}
                placeholder="AAAA-MM-DD"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Fecha de Fin</Text>
              <TextInput
                style={styles.formInput}
                value={assignmentForm.FECHA_FIN}
                onChangeText={(text) => setAssignmentForm({...assignmentForm, FECHA_FIN: text})}
                placeholder="AAAA-MM-DD"
              />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={handleSubmitAssignment}
              >
                <Text style={styles.saveButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Mostrar modales de selección */}
      {renderTeacherSelectionModal()}
      {renderCourseSelectionModal()}

      {/* Loader overlay */}
      {isLoading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>Procesando...</Text>
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
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: 'white',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
  assignmentList: {
    padding: 15,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    padding: 20,
  },
  assignmentCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  assignmentInfo: {
    flex: 1,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  courseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  groupBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  groupText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  teacherName: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  periodText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  assignmentActions: {
    justifyContent: 'space-around',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  editButton: {
    backgroundColor: '#2196F3',
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
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
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
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    height: 45,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    height: 45,
    paddingHorizontal: 15,
  },
  pickerPlaceholder: {
    color: '#999',
  },
  pickerSelectedText: {
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    height: 45,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#6C63FF',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectionModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  selectionModalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  selectionModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  selectionSearchInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    height: 45,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  selectionList: {
    maxHeight: 300,
  },
  selectionItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectionItemText: {
    fontSize: 16,
    color: '#333',
  },
  selectionItemSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  selectionCloseButton: {
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 15,
  },
  selectionCloseButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default DocenteCursoManagement;