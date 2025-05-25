import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getGruposDocente } from './apiServiceDocente';

const DocenteHomeScreen = ({ navigation, route }) => {
  const [grupos, setGrupos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const userData = route.params?.userData;

  useEffect(() => {
    fetchGrupos();
  }, []);

  const fetchGrupos = async () => {
    try {
      setIsLoading(true);
      const gruposData = await getGruposDocente();
      setGrupos(gruposData);
      setError(null);
    } catch (err) {
      console.error('Error al cargar grupos:', err);
      setError('No se pudieron cargar los grupos. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerEstudiantes = (grupo) => {
    navigation.navigate('EstudiantesGrupo', { 
      grupoId: grupo.ID,
      grupoNombre: `${grupo.NOMBRE_CURSO} - Grupo ${grupo.GRUPO}`,
      periodo: grupo.PERIODO,
      modo: 'consulta'
    });
  };

  const handleGestionarCalificaciones = (grupo) => {
    navigation.navigate('EstudiantesGrupo', { 
      grupoId: grupo.ID,
      grupoNombre: `${grupo.NOMBRE_CURSO} - Grupo ${grupo.GRUPO}`,
      periodo: grupo.PERIODO,
      modo: 'calificaciones'
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No establecida';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const renderGrupoItem = ({ item }) => (
    <View style={styles.grupoCard}>
      <View style={styles.grupoInfo}>
        <Text style={styles.grupoNombre}>{item.NOMBRE_CURSO}</Text>
        <Text style={styles.grupoDetalle}>Grupo: {item.GRUPO}</Text>
        <Text style={styles.grupoDetalle}>Periodo: {item.PERIODO}</Text>
        <Text style={styles.grupoDetalle}>
          Fechas: {formatDate(item.FECHA_INICIO)} - {formatDate(item.FECHA_FIN)}
        </Text>
      </View>
      <View style={styles.grupoActions}>
        <TouchableOpacity 
          style={[styles.grupoButton, styles.buttonConsulta]}
          onPress={() => handleVerEstudiantes(item)}
        >
          <MaterialIcons name="people" size={18} color="white" />
          <Text style={styles.grupoButtonText}>Consultar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.grupoButton, styles.buttonCalificaciones]}
          onPress={() => handleGestionarCalificaciones(item)}
        >
          <MaterialIcons name="assignment" size={18} color="white" />
          <Text style={styles.grupoButtonText}>Calificar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Cargando grupos...</Text>
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
          onPress={fetchGrupos}
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
        <Text style={styles.headerTitle}>Mis Grupos</Text>
        {userData && (
          <Text style={styles.welcomeUser}>
            ¡Hola, {userData.nombre} {userData.apellido}!
          </Text>
        )}
      </LinearGradient>

      <View style={styles.contentContainer}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="school" size={24} color="#6C63FF" />
          <Text style={styles.sectionTitle}>Grupos Asignados</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={fetchGrupos}
          >
            <MaterialIcons name="refresh" size={24} color="#6C63FF" />
          </TouchableOpacity>
        </View>

        {grupos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="info" size={48} color="#6C63FF" />
            <Text style={styles.emptyText}>No tienes grupos asignados</Text>
          </View>
        ) : (
          <FlatList
            data={grupos}
            renderItem={renderGrupoItem}
            keyExtractor={item => item.ID.toString()}
            contentContainerStyle={styles.gruposList}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 40,
    paddingBottom: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  welcomeUser: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 5,
  },
  contentContainer: {
    flex: 1,
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  refreshButton: {
    padding: 5,
  },
  gruposList: {
    paddingBottom: 20,
  },
  grupoCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  grupoInfo: {
    marginBottom: 15,
  },
  grupoNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  grupoDetalle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  grupoActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  grupoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    minWidth: 120,
  },
  buttonConsulta: {
    backgroundColor: '#6C63FF',
  },
  buttonCalificaciones: {
    backgroundColor: '#4CAF50',
  },
  grupoButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
    textAlign: 'center',
  },
});

export default DocenteHomeScreen;