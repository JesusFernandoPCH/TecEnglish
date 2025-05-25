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
  getUserList, 
  createUser, 
  updateUser, 
  deleteUser 
} from './apiServiceAdmin';

const UserManagement = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' o 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [userForm, setUserForm] = useState({
    NOMBRE: '',
    APELLIDO: '',
    NOCONTROL: '',
    EMAIL: '',
    PASSWORD: ''
  });

  // Cargar lista de usuarios
  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtrar usuarios cuando cambia la búsqueda
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

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const userList = await getUserList();
      setUsers(userList);
      setFilteredUsers(userList);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = () => {
    setModalMode('create');
    setUserForm({
      NOMBRE: '',
      APELLIDO: '',
      NOCONTROL: '',
      EMAIL: '',
      PASSWORD: ''
    });
    setIsModalVisible(true);
  };

  const handleEditUser = (user) => {
    setModalMode('edit');
    setSelectedUser(user);
    setUserForm({
      NOMBRE: user.NOMBRE,
      APELLIDO: user.APELLIDO,
      NOCONTROL: user.NOCONTROL,
      EMAIL: user.EMAIL,
      PASSWORD: '' // No mostrar contraseña en edición
    });
    setIsModalVisible(true);
  };

  const handleDeleteUser = (user) => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Estás seguro de que deseas eliminar al usuario ${user.NOMBRE} ${user.APELLIDO}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await deleteUser(user.ID);
              // Actualizar lista local
              const updatedUsers = users.filter(u => u.ID !== user.ID);
              setUsers(updatedUsers);
              setFilteredUsers(updatedUsers);
              Alert.alert('Éxito', 'Usuario eliminado correctamente');
            } catch (error) {
              console.error('Error al eliminar usuario:', error);
              Alert.alert('Error', 'No se pudo eliminar el usuario');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleSubmitUser = async () => {
    // Validar formulario
    if (!userForm.NOMBRE || !userForm.NOCONTROL || 
        (modalMode === 'create' && !userForm.PASSWORD)) {
      Alert.alert('Error', 'Por favor completa los campos obligatorios: Nombre, No. Control y Contraseña');
      return;
    }

    try {
      setIsLoading(true);
      
      if (modalMode === 'create') {
        // Crear usuario
        const newUser = await createUser(userForm);
        setUsers([...users, newUser]);
        Alert.alert('Éxito', 'Usuario creado correctamente');
      } else {
        // Actualizar usuario
        const updatedUser = await updateUser(selectedUser.ID, userForm);
        const updatedUsers = users.map(user => 
          user.ID === selectedUser.ID ? { ...user, ...updatedUser } : user
        );
        setUsers(updatedUsers);
        Alert.alert('Éxito', 'Usuario actualizado correctamente');
      }
      
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      Alert.alert('Error', 'No se pudo guardar el usuario');
    } finally {
      setIsLoading(false);
    }
  };

  // Renderizar cada elemento de la lista
  const renderUserItem = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Image 
          source={require('./assets/default-profile.png')} 
          style={styles.userAvatar}
        />
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.NOMBRE} {item.APELLIDO}</Text>
          <Text style={styles.userControl}>No. Control: {item.NOCONTROL}</Text>
          <Text style={styles.userEmail}>{item.EMAIL}</Text>
        </View>
      </View>
      
      <View style={styles.userActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.detailsButton]}
          onPress={() => navigation.navigate('StudentDetail', { 
            userId: item.ID, 
            userName: `${item.NOMBRE} ${item.APELLIDO}` 
          })}
        >
          <MaterialIcons name="visibility" size={20} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditUser(item)}
        >
          <MaterialIcons name="edit" size={20} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteUser(item)}
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
        <Text style={styles.headerTitle}>Gestión de Usuarios</Text>
      </LinearGradient>

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
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleCreateUser}
        >
          <MaterialIcons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {isLoading && users.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>Cargando usuarios...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={item => item.ID.toString()}
          contentContainerStyle={styles.userList}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {searchText 
                ? 'No se encontraron usuarios con ese criterio' 
                : 'No hay usuarios registrados'}
            </Text>
          }
        />
      )}

      {/* Modal para crear/editar usuario */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {modalMode === 'create' ? 'Nuevo Usuario' : 'Editar Usuario'}
            </Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Nombre *</Text>
              <TextInput
                style={styles.formInput}
                value={userForm.NOMBRE}
                onChangeText={(text) => setUserForm({...userForm, NOMBRE: text})}
                placeholder="Nombre"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Apellido</Text>
              <TextInput
                style={styles.formInput}
                value={userForm.APELLIDO}
                onChangeText={(text) => setUserForm({...userForm, APELLIDO: text})}
                placeholder="Apellido"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>No. Control *</Text>
              <TextInput
                style={styles.formInput}
                value={userForm.NOCONTROL}
                onChangeText={(text) => setUserForm({...userForm, NOCONTROL: text})}
                placeholder="Número de Control"
                keyboardType="number-pad"
                editable={modalMode === 'create'} // No editable si estamos editando
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email</Text>
              <TextInput
                style={styles.formInput}
                value={userForm.EMAIL}
                onChangeText={(text) => setUserForm({...userForm, EMAIL: text})}
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
                value={userForm.PASSWORD}
                onChangeText={(text) => setUserForm({...userForm, PASSWORD: text})}
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
                onPress={handleSubmitUser}
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
  userList: {
    padding: 15,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    padding: 20,
  },
  userCard: {
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
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
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
    marginTop: 3,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userActions: {
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
  detailsButton: {
    backgroundColor: '#FF9800',
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

export default UserManagement;