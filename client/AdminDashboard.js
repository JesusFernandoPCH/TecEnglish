// En AdminDashboard.js

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getStats } from './apiServiceAdmin';

const AdminDashboard = ({ navigation, route }) => {
  const { userData, handleLogout } = route.params || {};
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchStats();
  }, []);
  
  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const statsData = await getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Funciones de navegación para las nuevas características
  const navigateToImportStudents = () => {
    navigation.navigate('ImportStudents');
  };

  const navigateToBulkCourseAssignment = () => {
    navigation.navigate('BulkCourseAssignment');
  };

  const navigateToTeacherManagement = () => {
    navigation.navigate('TeacherManagement');
  };
  
  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#6C63FF', '#4158D0']}
        style={styles.header}
      >
        <Text style={styles.welcomeText}>
          ¡Bienvenido, {userData?.nombre || 'Administrador'}!
        </Text>
        <Text style={styles.subtitleText}>
          Panel de Administración
        </Text>
      </LinearGradient>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>Cargando estadísticas...</Text>
        </View>
      ) : (
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Estadísticas Generales</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <MaterialIcons name="people" size={24} color="#6C63FF" />
              <Text style={styles.statNumber}>{stats?.totalUsers || 0}</Text>
              <Text style={styles.statLabel}>Estudiantes</Text>
            </View>
            
            <View style={styles.statCard}>
              <MaterialIcons name="school" size={24} color="#4CAF50" />
              <Text style={styles.statNumber}>{stats?.completedCourses || 0}</Text>
              <Text style={styles.statLabel}>Cursos Completados</Text>
            </View>
            
            <View style={styles.statCard}>
              <MaterialIcons name="assignment" size={24} color="#FF9800" />
              <Text style={styles.statNumber}>{stats?.scheduledExams || 0}</Text>
              <Text style={styles.statLabel}>Exámenes Programados</Text>
            </View>
            
            <View style={styles.statCard}>
              <MaterialIcons name="person" size={24} color="#2196F3" />
              <Text style={styles.statNumber}>{stats?.activeUsers || 0}</Text>
              <Text style={styles.statLabel}>Usuarios Activos</Text>
            </View>
          </View>
        </View>
      )}
      
      {/* Sección de acciones rápidas existente */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Usuarios')}
          >
            <MaterialIcons name="person-add" size={24} color="white" />
            <Text style={styles.actionButtonText}>Nuevo Usuario</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Cursos')}
          >
            <MaterialIcons name="add-circle" size={24} color="white" />
            <Text style={styles.actionButtonText}>Nuevo Curso</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Exámenes')}
          >
            <MaterialIcons name="note-add" size={24} color="white" />
            <Text style={styles.actionButtonText}>Nuevo Examen</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* NUEVA SECCIÓN: Herramientas Masivas */}
      <View style={styles.adminTools}>
        <Text style={styles.sectionTitle}>Herramientas Masivas</Text>
        
        <View style={styles.toolsGrid}>
          <TouchableOpacity 
            style={styles.toolCard} 
            onPress={navigateToImportStudents}
          >
            <View style={[styles.toolIconContainer, { backgroundColor: '#4CAF50' }]}>
              <MaterialIcons name="upload-file" size={28} color="white" />
            </View>
            <Text style={styles.toolName}>Importar Estudiantes</Text>
            <Text style={styles.toolDescription}>Carga masiva desde Excel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.toolCard} 
            onPress={navigateToBulkCourseAssignment}
          >
            <View style={[styles.toolIconContainer, { backgroundColor: '#2196F3' }]}>
              <MaterialIcons name="group-work" size={28} color="white" />
            </View>
            <Text style={styles.toolName}>Asignación Masiva</Text>
            <Text style={styles.toolDescription}>Gestionar cursos para múltiples estudiantes</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
          style={styles.toolCard} 
          onPress={() => navigation.navigate('DocenteCursoManagement')}
          >
            <View style={[styles.toolIconContainer, { backgroundColor: '#673AB7' }]}>
              <MaterialIcons name="assignment-ind" size={28} color="white" />
              </View>
              <Text style={styles.toolName}>Asignar Docentes</Text>
              <Text style={styles.toolDescription}>Gestionar cursos para docentes</Text>
              </TouchableOpacity>

          <TouchableOpacity 
            style={styles.toolCard} 
            onPress={navigateToTeacherManagement}
          >
            <View style={[styles.toolIconContainer, { backgroundColor: '#FF9800' }]}>
              <MaterialIcons name="person" size={28} color="white" />
            </View>
            <Text style={styles.toolName}>Gestión de Docentes</Text>
            <Text style={styles.toolDescription}>Administrar profesores</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Botón de cerrar sesión */}
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <MaterialIcons name="exit-to-app" size={24} color="white" />
        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitleText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    width: '48%',
    marginBottom: 15,
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
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  quickActions: {
    padding: 20,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Añadir esta propiedad para que los elementos pasen a la siguiente línea
    justifyContent: 'space-between',
    marginHorizontal: -5, // Compensar el margen de los botones
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6C63FF',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginVertical: 5, // Añadir margen vertical
    marginHorizontal: 5, // Añadir margen horizontal
    width: '30%', // Establecer un ancho fijo
    justifyContent: 'center', // Centrar contenido
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
  shadowRadius: 3,
  elevation: 3,
},
  actionButtonText: {
  color: 'white',
  fontWeight: 'bold',
  marginLeft: 5,
  fontSize: 12, // Reducir tamaño del texto
},
  // Nuevos estilos para las herramientas masivas
  adminTools: {
    padding: 20,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  toolCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    width: '48%',
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
  toolIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  toolName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  toolDescription: {
    fontSize: 12,
    color: '#666',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#FF5252',
    margin: 20,
    padding: 15,
    borderRadius: 8,
    justifyContent: 'center',
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
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
});

export default AdminDashboard;