// BulkCourseAssignment.js
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
  getUserList,
  getCourseList,
  bulkAssignCourseToUsers,
  bulkRemoveCourseFromUsers
} from './apiServiceAdmin';

const BulkCourseAssignment = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCourseModalVisible, setIsCourseModalVisible] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [assignmentData, setAssignmentData] = useState({
    ESTADO: 'Pendiente',
    FECHA_INICIO: new Date().toISOString().split('T')[0],
    FECHA_FIN: null
  });
  
  useEffect(() => {
    loadData();
  }, []);
  
  useEffect(() => {
    if (searchText) {
      const filtered = users.filter(user => 
        user.NOMBRE.toLowerCase().includes(searchText.toLowerCase()) ||
        user.APELLIDO.toLowerCase().includes(searchText.toLowerCase()) ||
        user.NOCONTROL.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchText, users]);
  
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [userList, courseList] = await Promise.all([
        getUserList(),
        getCourseList()
      ]);
      
      setUsers(userList);
      setFilteredUsers(userList);
      setCourses(courseList);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleUserSelection = (user) => {
    if (selectedUsers.some(u => u.ID === user.ID)) {
      setSelectedUsers(selectedUsers.filter(u => u.ID !== user.ID));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };
  
  const selectAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers([...filteredUsers]);
    }
  };
  
  const openCourseModal = () => {
    if (selectedUsers.length === 0) {
      Alert.alert('Aviso', 'Selecciona al menos un estudiante');
      return;
    }
    setIsCourseModalVisible(true);
  };
  
  const handleCourseSelection = (course) => {
    setSelectedCourse(course);
  };
  
  const handleAssignCourse = async () => {
    if (!selectedCourse) {
      Alert.alert('Error', 'Selecciona un curso');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Preparar datos para la asignación
      const assignmentDetails = {
        ...assignmentData,
        userIds: selectedUsers.map(user => user.ID),
        courseId: selectedCourse.ID
      };
      
      const result = await bulkAssignCourseToUsers(assignmentDetails);
      
      Alert.alert(
        'Éxito',
        `Se asignó el curso "${selectedCourse.NOMBRE}" a ${result.successful} estudiantes. Fallidos: ${result.failed}`,
        [
          { text: 'OK', onPress: () => setIsCourseModalVisible(false) }
        ]
      );
      
      // Limpiar selecciones
      setSelectedUsers([]);
      setSelectedCourse(null);
    } catch (error) {
      console.error('Error al asignar curso:', error);
      Alert.alert('Error', 'No se pudo asignar el curso');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRemoveCourse = async () => {
    if (!selectedCourse) {
      Alert.alert('Error', 'Selecciona un curso');
      return;
    }
    
    // Confirmar antes de eliminar
    Alert.alert(
      'Confirmar Eliminación',
      `¿Estás seguro de que deseas eliminar el curso "${selectedCourse.NOMBRE}" de ${selectedUsers.length} estudiantes?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              
              const removalDetails = {
                userIds: selectedUsers.map(user => user.ID),
                courseId: selectedCourse.ID
              };
              
              const result = await bulkRemoveCourseFromUsers(removalDetails);
              
              Alert.alert(
                'Éxito',
                `Se eliminó el curso "${selectedCourse.NOMBRE}" de ${result.successful} estudiantes. Fallidos: ${result.failed}`,
                [
                  { text: 'OK', onPress: () => setIsCourseModalVisible(false) }
                ]
              );
              
              // Limpiar selecciones
              setSelectedUsers([]);
              setSelectedCourse(null);
            } catch (error) {
              console.error('Error al eliminar curso:', error);
              Alert.alert('Error', 'No se pudo eliminar el curso');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };
  
  const renderUserItem = ({ item }) => {
    const isSelected = selectedUsers.some(user => user.ID === item.ID);
    
    return (
      <TouchableOpacity 
        style={[
          styles.userItem,
          isSelected && styles.userItemSelected
        ]}
        onPress={() => toggleUserSelection(item)}
      >
        <View style={styles.userInfo}>
          <MaterialIcons 
            name={isSelected ? "check-box" : "check-box-outline-blank"} 
            size={24} 
            color={isSelected ? "#6C63FF" : "#999"} 
            style={styles.checkbox}
          />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.NOMBRE} {item.APELLIDO}</Text>
            <Text style={styles.userControl}>{item.NOCONTROL}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  const renderCourseItem = ({ item }) => {
    const isSelected = selectedCourse && selectedCourse.ID === item.ID;
    
    return (
      <TouchableOpacity 
        style={[
          styles.courseItem,
          isSelected && styles.courseItemSelected
        ]}
        onPress={() => handleCourseSelection(item)}
      >
        <View style={styles.courseInfo}>
          <MaterialIcons 
            name={isSelected ? "radio-button-checked" : "radio-button-unchecked"} 
            size={24} 
            color={isSelected ? "#6C63FF" : "#999"} 
            style={styles.radio}
          />
          <View style={styles.courseDetails}>
            <Text style={styles.courseName}>{item.NOMBRE}</Text>
            <Text style={styles.courseDescription}>{item.DESCRIPCION}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
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
        <Text style={styles.headerTitle}>Asignación Masiva de Cursos</Text>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={24} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar estudiantes..."
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <MaterialIcons name="clear" size={24} color="#666" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      
      <View style={styles.selectionHeader}>
        <TouchableOpacity 
          style={styles.selectAllButton}
          onPress={selectAllUsers}
        >
          <MaterialIcons 
            name={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0 ? "check-box" : "check-box-outline-blank"} 
            size={24} 
            color="#6C63FF" 
          />
          <Text style={styles.selectAllText}>
            {selectedUsers.length === filteredUsers.length && filteredUsers.length > 0 
              ? "Deseleccionar Todos" 
              : "Seleccionar Todos"}
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.selectionCount}>
          {selectedUsers.length} seleccionados
        </Text>
      </View>
      
      {isLoading && users.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>Cargando estudiantes...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={item => item.ID.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {searchText 
                ? 'No se encontraron estudiantes con ese criterio' 
                : 'No hay estudiantes registrados'}
            </Text>
          }
        />
      )}
      
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity 
          style={[
            styles.actionButton,
            selectedUsers.length === 0 && styles.disabledButton
          ]}
          onPress={openCourseModal}
          disabled={selectedUsers.length === 0}
        >
          <MaterialIcons name="school" size={24} color="white" />
          <Text style={styles.actionButtonText}>
            Asignar/Eliminar Curso
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Modal para asignar/eliminar curso */}
      <Modal
        visible={isCourseModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCourseModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Gestión Masiva de Cursos
            </Text>
            
            <Text style={styles.modalSubtitle}>
              Seleccionados: {selectedUsers.length} estudiantes
            </Text>
            
            <Text style={styles.modalSectionTitle}>
              Selecciona un curso:
            </Text>
            
            <FlatList
              data={courses}
              renderItem={renderCourseItem}
              keyExtractor={item => item.ID.toString()}
              style={styles.coursesList}
              contentContainerStyle={styles.coursesListContent}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No hay cursos disponibles</Text>
              }
            />
            
            {selectedCourse && (
              <View style={styles.assignmentOptionsContainer}>
                <Text style={styles.optionsTitle}>Opciones de asignación:</Text>
                
                <View style={styles.optionRow}>
                  <Text style={styles.optionLabel}>Estado:</Text>
                  <View style={styles.statusOptions}>
                    <TouchableOpacity 
                      style={[
                        styles.statusOption,
                        assignmentData.ESTADO === 'Pendiente' && styles.statusOptionSelected
                      ]}
                      onPress={() => setAssignmentData({...assignmentData, ESTADO: 'Pendiente'})}
                    >
                      <Text style={styles.statusOptionText}>Pendiente</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[
                        styles.statusOption,
                        assignmentData.ESTADO === 'En curso' && styles.statusOptionSelected
                      ]}
                      onPress={() => setAssignmentData({...assignmentData, ESTADO: 'En curso'})}
                    >
                      <Text style={styles.statusOptionText}>En curso</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[
                        styles.statusOption,
                        assignmentData.ESTADO === 'Completado' && styles.statusOptionSelected
                      ]}
                      onPress={() => setAssignmentData({...assignmentData, ESTADO: 'Completado'})}
                    >
                      <Text style={styles.statusOptionText}>Completado</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.optionRow}>
                  <Text style={styles.optionLabel}>Fecha de inicio:</Text>
                  <TouchableOpacity style={styles.datePickerButton}>
                    <Text>{assignmentData.FECHA_INICIO || 'Seleccionar'}</Text>
                    <MaterialIcons name="date-range" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.optionRow}>
                  <Text style={styles.optionLabel}>Fecha de fin:</Text>
                  <TouchableOpacity style={styles.datePickerButton}>
                    <Text>{assignmentData.FECHA_FIN || 'Seleccionar'}</Text>
                    <MaterialIcons name="date-range" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setIsCourseModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              {selectedCourse && (
                <>
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={handleRemoveCourse}
                  >
                    <Text style={styles.actionButtonText}>Eliminar Curso</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.assignButton}
                    onPress={handleAssignCourse}
                  >
                    <Text style={styles.actionButtonText}>Asignar Curso</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
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
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectAllText: {
    fontSize: 14,
    color: '#6C63FF',
    fontWeight: '500',
    marginLeft: 5,
  },
  selectionCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  listContainer: {
    padding: 15,
  },
  userItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userItemSelected: {
    backgroundColor: '#EDEBFF',
    borderColor: '#6C63FF',
    borderWidth: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    marginRight: 10,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userControl: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    padding: 20,
  },
  actionButtonsContainer: {
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6C63FF',
    borderRadius: 8,
    padding: 15,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
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
    width: '100%',
    maxHeight: '80%',
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  coursesList: {
    maxHeight: 200,
    marginBottom: 15,
  },
  coursesListContent: {
    paddingBottom: 10,
  },
  courseItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  courseItemSelected: {
    backgroundColor: '#EDEBFF',
  },
  courseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  radio: {
    marginRight: 10,
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
    marginTop: 2,
  },
  assignmentOptionsContainer: {
    marginTop: 10,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 15,
  },
  optionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  optionLabel: {
    width: 100,
    fontSize: 14,
    color: '#666',
  },
  statusOptions: {
    flexDirection: 'row',
    flex: 1,
  },
  statusOption: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginHorizontal: 2,
    borderRadius: 4,
  },
  statusOptionSelected: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  statusOptionText: {
    fontSize: 12,
    color: '#666',
  },
  datePickerButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 10,
    borderRadius: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginRight: 5,
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  removeButton: {
    flex: 1,
    backgroundColor: '#FF5252',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  assignButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginLeft: 5,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BulkCourseAssignment;