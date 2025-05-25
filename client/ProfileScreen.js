import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserProfile, updateProfile, changePassword } from './apiService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ProfileScreen = ({ navigation, route }) => {
  // Estados para los datos del perfil
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para edición de perfil
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    NOMBRE: '',
    APELLIDO: '',
    EMAIL: ''
  });
  
  // Estados para cambio de contraseña
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Cargar datos del perfil desde la API
  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      const profileData = await getUserProfile();
      setProfile(profileData);
      
      // Preparar datos para edición si se necesita
      setEditData({
        NOMBRE: profileData.user.nombre,
        APELLIDO: profileData.user.apellido,
        EMAIL: profileData.user.email
      });
      
      setError(null);
    } catch (err) {
      console.error('Error al cargar datos del perfil:', err);
      setError('No se pudieron cargar los datos del perfil. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Actualizar datos del perfil
  const handleUpdateProfile = async () => {
    try {
      setIsLoading(true);
      
      // Validar datos
      if (!editData.NOMBRE.trim()) {
        Alert.alert('Error', 'El nombre no puede estar vacío');
        setIsLoading(false);
        return;
      }
      
      // Llamar a la API para actualizar
      const result = await updateProfile(editData);
      
      // Actualizar estado local
      setProfile(prev => ({
        ...prev,
        user: {
          ...prev.user,
          nombre: editData.NOMBRE,
          apellido: editData.APELLIDO,
          email: editData.EMAIL
        }
      }));
      
      // Salir del modo edición
      setIsEditing(false);
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
    } catch (err) {
      console.error('Error al actualizar perfil:', err);
      Alert.alert('Error', 'No se pudo actualizar el perfil. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Cambiar contraseña
  const handleChangePassword = async () => {
    try {
      // Validar que las contraseñas coincidan
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        Alert.alert('Error', 'Las contraseñas no coinciden');
        return;
      }
      
      // Validar longitud mínima
      if (passwordData.newPassword.length < 4) {
        Alert.alert('Error', 'La contraseña debe tener al menos 4 caracteres');
        return;
      }
      
      setIsLoading(true);
      
      // Llamar a la API para cambiar contraseña
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      
      // Reiniciar campos y cerrar modal
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setIsChangingPassword(false);
      
      Alert.alert('Éxito', 'Contraseña actualizada correctamente');
    } catch (err) {
      console.error('Error al cambiar contraseña:', err);
      Alert.alert('Error', err.message || 'No se pudo cambiar la contraseña. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Modal para edición de perfil
  const renderEditProfileModal = () => (
    <Modal
      visible={isEditing}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setIsEditing(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Editar Perfil</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre</Text>
            <TextInput
              style={styles.modalInput}
              value={editData.NOMBRE}
              onChangeText={(text) => setEditData({...editData, NOMBRE: text})}
              placeholder="Nombre"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Apellido</Text>
            <TextInput
              style={styles.modalInput}
              value={editData.APELLIDO}
              onChangeText={(text) => setEditData({...editData, APELLIDO: text})}
              placeholder="Apellido"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.modalInput}
              value={editData.EMAIL}
              onChangeText={(text) => setEditData({...editData, EMAIL: text})}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]} 
              onPress={() => setIsEditing(false)}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.saveButton]} 
              onPress={handleUpdateProfile}
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
  );

  // Modal para cambio de contraseña
  const renderChangePasswordModal = () => (
    <Modal
      visible={isChangingPassword}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setIsChangingPassword(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Cambiar Contraseña</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Contraseña Actual</Text>
            <TextInput
              style={styles.modalInput}
              value={passwordData.currentPassword}
              onChangeText={(text) => setPasswordData({...passwordData, currentPassword: text})}
              placeholder="Contraseña Actual"
              secureTextEntry
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nueva Contraseña</Text>
            <TextInput
              style={styles.modalInput}
              value={passwordData.newPassword}
              onChangeText={(text) => setPasswordData({...passwordData, newPassword: text})}
              placeholder="Nueva Contraseña"
              secureTextEntry
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirmar Contraseña</Text>
            <TextInput
              style={styles.modalInput}
              value={passwordData.confirmPassword}
              onChangeText={(text) => setPasswordData({...passwordData, confirmPassword: text})}
              placeholder="Confirmar Contraseña"
              secureTextEntry
            />
          </View>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]} 
              onPress={() => setIsChangingPassword(false)}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.saveButton]} 
              onPress={handleChangePassword}
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
  );

  // Mostrar pantalla de carga mientras se obtienen los datos
  if (isLoading && !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  // Mostrar mensaje de error si ocurre algún problema
  if (error && !profile) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={60} color="#FF5252" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchProfileData}
        >
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Datos para renderizar
  const userData = profile?.user || {};
  const coursesData = profile?.courses || [];
  const examsData = profile?.exams || [];
  const currentCourseData = profile?.currentCourse || null;

  return (
    <ScrollView style={styles.container}>
      {/* Cover Photo */}
      <View style={styles.coverContainer}>
        <Image 
          source={require('./assets/default-cover.jpg')} 
          style={styles.coverImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.coverGradient}
        />
      </View>

      {/* Profile Photo */}
      <View style={styles.profileImageContainer}>
        <Image 
          source={require('./assets/default-profile.png')} 
          style={styles.profileImage}
          resizeMode="cover"
        />
      </View>

      {/* User Info */}
      <View style={styles.userInfoContainer}>
        <Text style={styles.userName}>{userData.nombre} {userData.apellido}</Text>
        <Text style={styles.userId}>No. Control: {userData.noControl}</Text>
        <Text style={styles.userEmail}>{userData.email}</Text>
        
        <View style={styles.userActionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={() => setIsEditing(true)}
          >
            <MaterialIcons name="edit" size={18} color="white" />
            <Text style={styles.actionButtonText}>Editar Perfil</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.passwordButton]}
            onPress={() => setIsChangingPassword(true)}
          >
            <MaterialIcons name="lock" size={18} color="white" />
            <Text style={styles.actionButtonText}>Cambiar Contraseña</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.logoutButton]}
            onPress={route.params?.handleLogout}
          >
            <MaterialIcons name="exit-to-app" size={18} color="white" />
            <Text style={styles.actionButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
        
        {currentCourseData && (
          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>Curso actual: </Text>
            <Text style={styles.statusValue}>{currentCourseData.nombre}</Text>
          </View>
        )}
      </View>

      {/* Course Progress Table */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="school" size={22} color="#6C63FF" />
          <Text style={styles.sectionTitle}>Progreso de Cursos</Text>
        </View>
        
        {coursesData.length > 0 ? (
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Curso</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Estado</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Calif.</Text>
            </View>
            
            {coursesData.map((course, index) => (
              <View 
                key={`course-${course.id || index}`} 
                style={[
                  styles.tableRow,
                  index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd
                ]}
              >
                <Text style={[styles.tableCell, { flex: 2 }]}>{course.nombre}</Text>
                <Text 
                  style={[
                    styles.tableCell, 
                    { flex: 1 },
                    course.estado === 'Completado' ? styles.statusCompleted : 
                    course.estado === 'En curso' ? styles.statusInProgress : 
                    styles.statusPending
                  ]}
                >
                  {course.estado}
                </Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>
                  {course.calificacion || '-'}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noDataText}>No hay cursos registrados</Text>
        )}
      </View>

      {/* Exams Table */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="assignment" size={22} color="#6C63FF" />
          <Text style={styles.sectionTitle}>Exámenes</Text>
        </View>
        
        {examsData.length > 0 ? (
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Examen</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Estado</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Calif.</Text>
            </View>
            
            {examsData.map((exam, index) => (
              <View 
                key={`exam-${exam.id || index}`} 
                style={[
                  styles.tableRow,
                  index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd
                ]}
              >
                <Text style={[styles.tableCell, { flex: 2 }]}>{exam.nombre}</Text>
                <Text 
                  style={[
                    styles.tableCell, 
                    { flex: 1 },
                    exam.estado === 'Completado' ? styles.statusCompleted : 
                    exam.estado === 'Programado' ? styles.statusScheduled : 
                    styles.statusPending
                  ]}
                >
                  {exam.estado}
                </Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>
                  {exam.calificacion || '-'}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noDataText}>No hay exámenes registrados</Text>
        )}
      </View>

      {/* Versión y Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>TecEnglish v1.0</Text>
        <Text style={styles.footerText}>© 2025 Instituto Tecnológico</Text>
      </View>

      {/* Renderizar modales */}
      {renderEditProfileModal()}
      {renderChangePasswordModal()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  coverContainer: {
    height: 180,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  profileImageContainer: {
    position: 'absolute',
    top: 130,
    left: SCREEN_WIDTH / 2 - 50,
    backgroundColor: 'white',
    padding: 5,
    borderRadius: 75,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 10,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  userInfoContainer: {
    marginTop: 60,
    padding: 20,
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userId: {
    fontSize: 16,
    color: '#666',
    marginBottom: 3,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  userActionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginHorizontal: 5,
    marginVertical: 5,
    minWidth: 110,
  },
  editButton: {
    backgroundColor: '#6C63FF',
  },
  passwordButton: {
    backgroundColor: '#4CAF50',
  },
  logoutButton: {
    backgroundColor: '#FF5252',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#90CAF9',
  },
  statusLabel: {
    fontSize: 16,
    color: '#1976D2',
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 16,
    color: '#1976D2',
    fontWeight: 'bold',
  },
  sectionContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 15,
    padding: 15,
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
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  tableContainer: {
    marginTop: 5,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#6C63FF',
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  tableHeaderText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tableRowEven: {
    backgroundColor: '#F5F5F5',
  },
  tableRowOdd: {
    backgroundColor: 'white',
  },
  tableCell: {
    fontSize: 14,
    color: '#333',
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
  noDataText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    padding: 20,
    fontStyle: 'italic',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
    padding: 10,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginVertical: 2,
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
    borderRadius: 15,
    padding: 20,
    width: '100%',
    maxWidth: 450,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    fontWeight: '500',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
  saveButton: {
    backgroundColor: '#6C63FF',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default ProfileScreen;