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
  getExamList, 
  createExam, 
  updateExam, 
  deleteExam
} from './apiServiceAdmin';

const ExamManagement = ({ navigation }) => {
  const [exams, setExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedExam, setSelectedExam] = useState(null);
  const [examForm, setExamForm] = useState({
    NOMBRE: '',
    DESCRIPCION: ''
  });

  // Cargar lista de exámenes
  useEffect(() => {
    fetchExams();
  }, []);

  // Filtrar exámenes cuando cambia la búsqueda
  useEffect(() => {
    if (searchText) {
      const filtered = exams.filter(exam => 
        exam.NOMBRE.toLowerCase().includes(searchText.toLowerCase()) ||
        (exam.DESCRIPCION && exam.DESCRIPCION.toLowerCase().includes(searchText.toLowerCase()))
      );
      setFilteredExams(filtered);
    } else {
      setFilteredExams(exams);
    }
  }, [searchText, exams]);

  const fetchExams = async () => {
    try {
      setIsLoading(true);
      const examList = await getExamList();
      setExams(examList);
      setFilteredExams(examList);
    } catch (error) {
      console.error('Error al cargar exámenes:', error);
      Alert.alert('Error', 'No se pudieron cargar los exámenes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateExam = () => {
    setModalMode('create');
    setExamForm({
      NOMBRE: '',
      DESCRIPCION: ''
    });
    setIsModalVisible(true);
  };

  const handleEditExam = (exam) => {
    setModalMode('edit');
    setSelectedExam(exam);
    setExamForm({
      NOMBRE: exam.NOMBRE,
      DESCRIPCION: exam.DESCRIPCION || ''
    });
    setIsModalVisible(true);
  };

  const handleDeleteExam = (exam) => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Estás seguro de que deseas eliminar el examen "${exam.NOMBRE}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await deleteExam(exam.ID);
              // Actualizar lista local
              const updatedExams = exams.filter(e => e.ID !== exam.ID);
              setExams(updatedExams);
              setFilteredExams(updatedExams);
              Alert.alert('Éxito', 'Examen eliminado correctamente');
            } catch (error) {
              console.error('Error al eliminar examen:', error);
              Alert.alert('Error', 'No se pudo eliminar el examen. Es posible que tenga usuarios asignados.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleSubmitExam = async () => {
    // Validar formulario
    if (!examForm.NOMBRE) {
      Alert.alert('Error', 'Por favor ingresa un nombre para el examen');
      return;
    }

    try {
      setIsLoading(true);
      
      if (modalMode === 'create') {
        // Crear examen
        const newExam = await createExam(examForm);
        setExams([...exams, newExam]);
        Alert.alert('Éxito', 'Examen creado correctamente');
      } else {
        // Actualizar examen
        const updatedExam = await updateExam(selectedExam.ID, examForm);
        const updatedExams = exams.map(exam => 
          exam.ID === selectedExam.ID ? { ...exam, ...updatedExam } : exam
        );
        setExams(updatedExams);
        Alert.alert('Éxito', 'Examen actualizado correctamente');
      }
      
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error al guardar examen:', error);
      Alert.alert('Error', 'No se pudo guardar el examen');
    } finally {
      setIsLoading(false);
    }
  };

  // Renderizar cada elemento de la lista
  const renderExamItem = ({ item }) => (
    <View style={styles.examCard}>
      <View style={styles.examInfo}>
        <View style={styles.examIconContainer}>
          <MaterialIcons name="description" size={30} color="#FF9800" />
        </View>
        <View style={styles.examDetails}>
          <Text style={styles.examName}>{item.NOMBRE}</Text>
          <Text style={styles.examDescription}>
            {item.DESCRIPCION || 'Sin descripción'}
          </Text>
        </View>
      </View>
      
      <View style={styles.examActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditExam(item)}
        >
          <MaterialIcons name="edit" size={20} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteExam(item)}
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
        <Text style={styles.headerTitle}>Gestión de Exámenes</Text>
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
          onPress={handleCreateExam}
        >
          <MaterialIcons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {isLoading && exams.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>Cargando exámenes...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredExams}
          renderItem={renderExamItem}
          keyExtractor={item => item.ID.toString()}
          contentContainerStyle={styles.examList}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {searchText 
                ? 'No se encontraron exámenes con ese criterio' 
                : 'No hay exámenes registrados'}
            </Text>
          }
        />
      )}

      {/* Modal para crear/editar examen */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {modalMode === 'create' ? 'Nuevo Examen' : 'Editar Examen'}
            </Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Nombre *</Text>
              <TextInput
                style={styles.formInput}
                value={examForm.NOMBRE}
                onChangeText={(text) => setExamForm({...examForm, NOMBRE: text})}
                placeholder="Nombre del examen"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Descripción</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={examForm.DESCRIPCION}
                onChangeText={(text) => setExamForm({...examForm, DESCRIPCION: text})}
                placeholder="Descripción del examen"
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
                onPress={handleSubmitExam}
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
    backgroundColor: '#FF9800',
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
  examList: {
    padding: 15,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    padding: 20,
  },
  examCard: {
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
  examInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  examIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  examDetails: {
    flex: 1,
  },
  examName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  examDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  examActions: {
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

export default ExamManagement;