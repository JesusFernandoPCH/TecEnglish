import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  getEstudiantesGrupo, 
  updateCalificacionEstudiante,
  exportarCalificaciones
} from './apiServiceDocente';

const EstudiantesGrupoScreen = ({ navigation, route }) => {
  const { grupoId, grupoNombre, periodo, modo } = route.params;
  
  const [estudiantes, setEstudiantes] = useState([]);
  const [filteredEstudiantes, setFilteredEstudiantes] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedEstudiante, setSelectedEstudiante] = useState(null);
  const [calificacion, setCalificacion] = useState('');
  const [comentario, setComentario] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchEstudiantes();
  }, []);

  useEffect(() => {
    if (searchText) {
      const filtered = estudiantes.filter(estudiante => 
        estudiante.NOMBRE.toLowerCase().includes(searchText.toLowerCase()) ||
        estudiante.APELLIDO.toLowerCase().includes(searchText.toLowerCase()) ||
        estudiante.NOCONTROL.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredEstudiantes(filtered);
    } else {
      setFilteredEstudiantes(estudiantes);
    }
  }, [searchText, estudiantes]);

  const fetchEstudiantes = async () => {
    try {
      setIsLoading(true);
      const data = await getEstudiantesGrupo(grupoId);
      // Ordenar alfabéticamente
      const ordenados = data.sort((a, b) => {
        if (a.APELLIDO === b.APELLIDO) {
          return a.NOMBRE.localeCompare(b.NOMBRE);
        }
        return a.APELLIDO.localeCompare(b.APELLIDO);
      });
      setEstudiantes(ordenados);
      setFilteredEstudiantes(ordenados);
      setError(null);
    } catch (err) {
      console.error('Error al cargar estudiantes:', err);
      setError('No se pudieron cargar los estudiantes. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCalificacion = (estudiante) => {
    setSelectedEstudiante(estudiante);
    setCalificacion(estudiante.CALIFICACION ? estudiante.CALIFICACION.toString() : '');
    setComentario(estudiante.COMENTARIO || '');
    setIsModalVisible(true);
  };

  const handleSaveCalificacion = async () => {
    try {
      // Validar calificación
      if (!calificacion) {
        Alert.alert('Error', 'La calificación no puede estar vacía');
        return;
      }
      
      const calificacionNum = parseInt(calificacion);
      if (isNaN(calificacionNum) || calificacionNum < 0 || calificacionNum > 100) {
        Alert.alert('Error', 'La calificación debe ser un número entre 0 y 100');
        return;
      }
      
      setIsLoading(true);
      
      const calificacionData = {
        ID_USUARIO: selectedEstudiante.ID,
        ID_DOCENTE_CURSO: grupoId,
        CALIFICACION: calificacionNum,
        COMENTARIO: comentario
      };
      
      await updateCalificacionEstudiante(calificacionData);
      
      // Actualizar la lista local
      const updatedEstudiantes = estudiantes.map(est => {
        if (est.ID === selectedEstudiante.ID) {
          return {
            ...est,
            CALIFICACION: calificacionNum,
            COMENTARIO: comentario,
            FECHA_CALIFICACION: new Date().toISOString()
          };
        }
        return est;
      });
      
      setEstudiantes(updatedEstudiantes);
      setFilteredEstudiantes(updatedEstudiantes);
      setIsModalVisible(false);
      
      Alert.alert('Éxito', 'Calificación guardada correctamente');
    } catch (err) {
      console.error('Error al guardar calificación:', err);
      Alert.alert('Error', 'No se pudo guardar la calificación. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportarCalificaciones = async () => {
    try {
      setIsExporting(true);
      
      // Verificar si hay calificaciones registradas
      const hayCalificaciones = estudiantes.some(est => est.CALIFICACION !== null);
      
      if (!hayCalificaciones) {
        Alert.alert('Aviso', 'No hay calificaciones registradas en este grupo. Califique a los estudiantes primero.');
        setIsExporting(false);
        return;
      }
      
      const fileName = `${grupoNombre.replace(/\s/g, '_')}_${periodo}.xlsx`;
      
      const result = await exportarCalificaciones(grupoId, fileName);
      
      Alert.alert('Éxito', 'Las calificaciones se han exportado correctamente');
    } catch (err) {
      console.error('Error al exportar calificaciones:', err);
      Alert.alert('Error', err.message || 'No se pudieron exportar las calificaciones');
    } finally {
      setIsExporting(false);
    }
  };

  const renderEstudianteItem = ({ item }) => (
    <View style={styles.estudianteCard}>
      <View style={styles.estudianteInfo}>
        <Text style={styles.estudianteNombre}>{item.APELLIDO} {item.NOMBRE}</Text>
        <Text style={styles.estudianteControl}>No. Control: {item.NOCONTROL}</Text>
        {modo === 'calificaciones' && (
          <View style={styles.calificacionContainer}>
            <Text style={styles.calificacionLabel}>Calificación:</Text>
            <Text style={styles.calificacionValue}>
              {item.CALIFICACION !== null ? item.CALIFICACION : 'No evaluado'}
            </Text>
          </View>
        )}
      </View>
      
      {modo === 'calificaciones' && (
        <TouchableOpacity 
          style={styles.calificarButton}
          onPress={() => handleEditCalificacion(item)}
        >
          <MaterialIcons name="edit" size={20} color="white" />
          <Text style={styles.calificarButtonText}>Calificar</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading && estudiantes.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Cargando estudiantes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={60} color="#FF5252" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchEstudiantes}
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
        <Text style={styles.headerTitle}>
          {modo === 'calificaciones' ? 'Gestionar Calificaciones' : 'Lista de Estudiantes'}
        </Text>
      </LinearGradient>

      <View style={styles.grupoInfoContainer}>
        <Text style={styles.grupoNombre}>{grupoNombre}</Text>
        <Text style={styles.grupoPeriodo}>Periodo: {periodo}</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={24} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre o no. control"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <MaterialIcons name="clear" size={24} color="#666" />
            </TouchableOpacity>
          ) : null}
        </View>
        
        {modo === 'calificaciones' && (
          <TouchableOpacity 
            style={styles.exportButton}
            onPress={handleExportarCalificaciones}
            disabled={isExporting}
          >
            <MaterialIcons name="file-download" size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>

      {filteredEstudiantes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="info" size={48} color="#6C63FF" />
          <Text style={styles.emptyText}>
            {searchText 
              ? 'No se encontraron estudiantes con ese criterio' 
              : 'No hay estudiantes en este grupo'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredEstudiantes}
          renderItem={renderEstudianteItem}
          keyExtractor={item => item.ID.toString()}
          contentContainerStyle={styles.estudiantesList}
        />
      )}

      {/* Modal para editar calificación */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Calificar Estudiante</Text>
            
            {selectedEstudiante && (
              <Text style={styles.modalSubtitle}>
                {selectedEstudiante.NOMBRE} {selectedEstudiante.APELLIDO} ({selectedEstudiante.NOCONTROL})
              </Text>
            )}
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Calificación (0-100) *</Text>
              <TextInput
                style={styles.formInput}
                value={calificacion}
                onChangeText={setCalificacion}
                placeholder="Calificación"
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Comentario (opcional)</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={comentario}
                onChangeText={setComentario}
                placeholder="Comentario"
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
                onPress={handleSaveCalificacion}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Loader overlay */}
      {(isLoading || isExporting) && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loaderText}>
            {isExporting ? 'Exportando calificaciones...' : 'Cargando...'}
          </Text>
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
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 10,
  },
  grupoInfoContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  grupoNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  grupoPeriodo: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
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
  exportButton: {
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
  estudiantesList: {
    padding: 15,
    paddingBottom: 30,
  },
  estudianteCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  estudianteInfo: {
    flex: 1,
  },
  estudianteNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  estudianteControl: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  calificacionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  calificacionLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
  },
  calificacionValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  calificarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6C63FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  calificarButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 15,
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
    maxWidth: 450,
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
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
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
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  }
});

export default EstudiantesGrupoScreen;