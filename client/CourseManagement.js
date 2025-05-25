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
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  getCourseList, 
  createCourse, 
  updateCourse, 
  deleteCourse
} from './apiServiceAdmin';

const CourseManagement = ({ navigation }) => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseForm, setCourseForm] = useState({
    NOMBRE: '',
    DESCRIPCION: ''
  });

  // Cargar lista de cursos
  useEffect(() => {
    fetchCourses();
  }, []);

  // Filtrar cursos cuando cambia la búsqueda
  useEffect(() => {
    if (searchText) {
      const filtered = courses.filter(course => 
        course.NOMBRE.toLowerCase().includes(searchText.toLowerCase()) ||
        (course.DESCRIPCION && course.DESCRIPCION.toLowerCase().includes(searchText.toLowerCase()))
      );
      setFilteredCourses(filtered);
    } else {
      setFilteredCourses(courses);
    }
  }, [searchText, courses]);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const courseList = await getCourseList();
      setCourses(courseList);
      setFilteredCourses(courseList);
    } catch (error) {
      console.error('Error al cargar cursos:', error);
      Alert.alert('Error', 'No se pudieron cargar los cursos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCourse = () => {
    setModalMode('create');
    setCourseForm({
      NOMBRE: '',
      DESCRIPCION: ''
    });
    setIsModalVisible(true);
  };

  const handleEditCourse = (course) => {
    setModalMode('edit');
    setSelectedCourse(course);
    setCourseForm({
      NOMBRE: course.NOMBRE,
      DESCRIPCION: course.DESCRIPCION || ''
    });
    setIsModalVisible(true);
  };

  const handleDeleteCourse = (course) => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Estás seguro de que deseas eliminar el curso "${course.NOMBRE}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await deleteCourse(course.ID);
              // Actualizar lista local
              const updatedCourses = courses.filter(c => c.ID !== course.ID);
              setCourses(updatedCourses);
              setFilteredCourses(updatedCourses);
              Alert.alert('Éxito', 'Curso eliminado correctamente');
            } catch (error) {
              console.error('Error al eliminar curso:', error);
              Alert.alert('Error', 'No se pudo eliminar el curso. Es posible que tenga usuarios asignados.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleSubmitCourse = async () => {
    // Validar formulario
    if (!courseForm.NOMBRE) {
      Alert.alert('Error', 'Por favor ingresa un nombre para el curso');
      return;
    }

    try {
      setIsLoading(true);
      
      if (modalMode === 'create') {
        // Crear curso
        const newCourse = await createCourse(courseForm);
        setCourses([...courses, newCourse]);
        Alert.alert('Éxito', 'Curso creado correctamente');
      } else {
        // Actualizar curso
        const updatedCourse = await updateCourse(selectedCourse.ID, courseForm);
        const updatedCourses = courses.map(course => 
          course.ID === selectedCourse.ID ? { ...course, ...updatedCourse } : course
        );
        setCourses(updatedCourses);
        Alert.alert('Éxito', 'Curso actualizado correctamente');
      }
      
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error al guardar curso:', error);
      Alert.alert('Error', 'No se pudo guardar el curso');
    } finally {
      setIsLoading(false);
    }
  };

  // Renderizar cada elemento de la lista
  const renderCourseItem = ({ item }) => (
    <View style={styles.courseCard}>
      <View style={styles.courseInfo}>
        <View style={styles.courseIconContainer}>
          <MaterialIcons name="school" size={30} color="#6C63FF" />
        </View>
        <View style={styles.courseDetails}>
          <Text style={styles.courseName}>{item.NOMBRE}</Text>
          <Text style={styles.courseDescription}>
            {item.DESCRIPCION || 'Sin descripción'}
          </Text>
        </View>
      </View>
      
      <View style={styles.courseActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditCourse(item)}
        >
          <MaterialIcons name="edit" size={20} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteCourse(item)}
        >
          <MaterialIcons name="delete" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
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
        <Text style={styles.headerTitle}>Gestión de Cursos</Text>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={24} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre o descripción"
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
          onPress={handleCreateCourse}
        >
          <MaterialIcons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {isLoading && courses.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>Cargando cursos...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCourses}
          renderItem={renderCourseItem}
          keyExtractor={item => item.ID.toString()}
          contentContainerStyle={styles.courseList}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {searchText 
                ? 'No se encontraron cursos con ese criterio' 
                : 'No hay cursos registrados'}
            </Text>
          }
        />
      )}

      {/* Modal para crear/editar curso */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {modalMode === 'create' ? 'Nuevo Curso' : 'Editar Curso'}
            </Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Nombre *</Text>
              <TextInput
                style={styles.formInput}
                value={courseForm.NOMBRE}
                onChangeText={(text) => setCourseForm({...courseForm, NOMBRE: text})}
                placeholder="Nombre del curso"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Descripción</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={courseForm.DESCRIPCION}
                onChangeText={(text) => setCourseForm({...courseForm, DESCRIPCION: text})}
                placeholder="Descripción del curso"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
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
                onPress={handleSubmitCourse}
              >
                <Text style={styles.saveButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  courseList: {
    padding: 15,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    padding: 20,
  },
  courseCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  courseInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  courseDetails: {
    flex: 1,
  },
  courseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  courseDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  courseActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
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
    maxHeight: '80%',
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
  textArea: {
    height: 100,
    paddingTop: 10,
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
  loaderOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default CourseManagement;