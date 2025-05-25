// TeacherManagement.js
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
  Image
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  getTeacherList, 
  createTeacher, 
  updateTeacher, 
  deleteTeacher 
} from './apiServiceAdmin';

const TeacherManagement = ({ navigation }) => {
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' o 'edit'
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherForm, setTeacherForm] = useState({
    NOMBRE: '',
    APELLIDO: '',
    EMAIL: '',
    PASSWORD: ''
  });

  // Cargar lista de docentes
  useEffect(() => {
    fetchTeachers();
  }, []);

  // Filtrar docentes cuando cambia la búsqueda
  useEffect(() => {
    if (searchText) {
      const filtered = teachers.filter(teacher => 
        teacher.NOMBRE.toLowerCase().includes(searchText.toLowerCase()) ||
        teacher.APELLIDO.toLowerCase().includes(searchText.toLowerCase()) ||
        teacher.EMAIL.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredTeachers(filtered);
    } else {
      setFilteredTeachers(teachers);
    }
  }, [searchText, teachers]);

  const fetchTeachers = async () => {
    try {
      setIsLoading(true);
      const teacherList = await getTeacherList();
      setTeachers(teacherList);
      setFilteredTeachers(teacherList);
    } catch (error) {
      console.error('Error al cargar docentes:', error);
      Alert.alert('Error', 'No se pudieron cargar los docentes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTeacher = () => {
    setModalMode('create');
    setTeacherForm({
      NOMBRE: '',
      APELLIDO: '',
      EMAIL: '',
      PASSWORD: ''
    });
    setIsModalVisible(true);
  };

  const handleEditTeacher = (teacher) => {
    setModalMode('edit');
    setSelectedTeacher(teacher);
    setTeacherForm({
      NOMBRE: teacher.NOMBRE,
      APELLIDO: teacher.APELLIDO,
      EMAIL: teacher.EMAIL,
      PASSWORD: ''
    });
    setIsModalVisible(true);
  };

  const handleDeleteTeacher = (teacher) => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Estás seguro de que deseas eliminar al docente ${teacher.NOMBRE} ${teacher.APELLIDO}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await deleteTeacher(teacher.ID);
              // Actualizar lista local
              const updatedTeachers = teachers.filter(t => t.ID !== teacher.ID);
              setTeachers(updatedTeachers);
              setFilteredTeachers(updatedTeachers);
              Alert.alert('Éxito', 'Docente eliminado correctamente');
            } catch (error) {
              console.error('Error al eliminar docente:', error);
              Alert.alert('Error', 'No se pudo eliminar el docente');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleSubmitTeacher = async () => {
    // Validar formulario
    if (!teacherForm.NOMBRE || !teacherForm.EMAIL || 
        (modalMode === 'create' && !teacherForm.PASSWORD)) {
      Alert.alert('Error', 'Por favor completa los campos obligatorios: Nombre, Email y Contraseña');
      return;
    }

    try {
      setIsLoading(true);
      
      if (modalMode === 'create') {
        // Crear docente
        const newTeacher = await createTeacher(teacherForm);
        setTeachers([...teachers, newTeacher]);
        Alert.alert('Éxito', 'Docente creado correctamente');
      } else {
        // Actualizar docente
        const updatedTeacher = await updateTeacher(selectedTeacher.ID, teacherForm);
        const updatedTeachers = teachers.map(teacher => 
          teacher.ID === selectedTeacher.ID ? { ...teacher, ...updatedTeacher } : teacher
        );
        setTeachers(updatedTeachers);
        Alert.alert('Éxito', 'Docente actualizado correctamente');
      }
      
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error al guardar docente:', error);
      Alert.alert('Error', error.message || 'No se pudo guardar el docente');
    } finally {
      setIsLoading(false);
    }
  };

  // Renderizar cada elemento de la lista
  const renderTeacherItem = ({ item }) => (
    <View style={styles.teacherCard}>
      <View style={styles.teacherInfo}>
        <Image 
          source={require('./assets/default-profile.png')} 
          style={styles.teacherAvatar}
        />
        <View style={styles.teacherDetails}>
          <Text style={styles.teacherName}>{item.NOMBRE} {item.APELLIDO}</Text>
          <Text style={styles.teacherEmail}>{item.EMAIL}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {item.ACTIVO ? 'Activo' : 'Inactivo'}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.teacherActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditTeacher(item)}
        >
          <MaterialIcons name="edit" size={20} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteTeacher(item)}
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
        <Text style={styles.headerTitle}>Gestión de Docentes</Text>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={24} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre o email"
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
          onPress={handleCreateTeacher}
        >
          <MaterialIcons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {isLoading && teachers.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>Cargando docentes...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTeachers}
          renderItem={renderTeacherItem}
          keyExtractor={item => item.ID.toString()}
          contentContainerStyle={styles.teacherList}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {searchText 
                ? 'No se encontraron docentes con ese criterio' 
                : 'No hay docentes registrados'}
            </Text>
          }
        />
      )}

      {/* Modal para crear/editar docente */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {modalMode === 'create' ? 'Nuevo Docente' : 'Editar Docente'}
            </Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Nombre *</Text>
              <TextInput
                style={styles.formInput}
                value={teacherForm.NOMBRE}
                onChangeText={(text) => setTeacherForm({...teacherForm, NOMBRE: text})}
                placeholder="Nombre"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Apellido</Text>
              <TextInput
                style={styles.formInput}
                value={teacherForm.APELLIDO}
                onChangeText={(text) => setTeacherForm({...teacherForm, APELLIDO: text})}
                placeholder="Apellido"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email *</Text>
              <TextInput
                style={styles.formInput}
                value={teacherForm.EMAIL}
                onChangeText={(text) => setTeacherForm({...teacherForm, EMAIL: text})}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                Contraseña {modalMode === 'create' ? '*' : '(dejar vacío para no cambiar)'}
              </Text>
              <TextInput
                style={styles.formInput}
                value={teacherForm.PASSWORD}
                onChangeText={(text) => setTeacherForm({...teacherForm, PASSWORD: text})}
                placeholder={modalMode === 'create' ? "Contraseña" : "Nueva contraseña (opcional)"}
                secureTextEntry
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
                onPress={handleSubmitTeacher}
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
  teacherList: {
    padding: 15,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    padding: 20,
  },
  teacherCard: {
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
  teacherInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  teacherAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  teacherDetails: {
    flex: 1,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  teacherEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  statusBadge: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 5,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  teacherActions: {
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

export default TeacherManagement;