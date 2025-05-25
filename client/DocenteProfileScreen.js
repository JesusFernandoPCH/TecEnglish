import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const DocenteProfileScreen = ({ route, navigation }) => {
  const { userData, handleLogout } = route.params || {};

  // Confirmar cierre de sesión
  const confirmLogout = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro de que deseas cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Cerrar Sesión", onPress: handleLogout, style: "destructive" }
      ]
    );
  };

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
        <Text style={styles.userName}>{userData?.nombre} {userData?.apellido}</Text>
        <Text style={styles.userEmail}>{userData?.email}</Text>
        <Text style={styles.userRole}>Docente</Text>
        
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => Alert.alert("Función no disponible", "Esta función estará disponible próximamente")}
          >
            <MaterialIcons name="edit" size={20} color="white" />
            <Text style={styles.actionButtonText}>Editar Perfil</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.logoutButton]}
            onPress={confirmLogout}
          >
            <MaterialIcons name="exit-to-app" size={20} color="white" />
            <Text style={styles.actionButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Info Sections */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="info" size={24} color="#6C63FF" />
          <Text style={styles.sectionTitle}>Información</Text>
        </View>
        
        <View style={styles.infoItem}>
          <MaterialIcons name="email" size={22} color="#666" style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Correo Electrónico</Text>
            <Text style={styles.infoValue}>{userData?.email || 'No disponible'}</Text>
          </View>
        </View>
        
        <View style={styles.infoItem}>
          <MaterialIcons name="school" size={22} color="#666" style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Departamento</Text>
            <Text style={styles.infoValue}>Departamento de Lenguas Extranjeras</Text>
          </View>
        </View>
        
        <View style={styles.infoItem}>
          <MaterialIcons name="event" size={22} color="#666" style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Fecha de Registro</Text>
            <Text style={styles.infoValue}>Mayo 2025</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="help" size={24} color="#6C63FF" />
          <Text style={styles.sectionTitle}>Ayuda</Text>
        </View>
        
        <TouchableOpacity style={styles.helpItem}>
          <MaterialIcons name="menu-book" size={22} color="#666" style={styles.helpIcon} />
          <View style={styles.helpContent}>
            <Text style={styles.helpTitle}>Manual del Docente</Text>
            <Text style={styles.helpDescription}>Guía completa sobre el uso del sistema</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color="#666" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.helpItem}>
          <MaterialIcons name="support-agent" size={22} color="#666" style={styles.helpIcon} />
          <View style={styles.helpContent}>
            <Text style={styles.helpTitle}>Soporte Técnico</Text>
            <Text style={styles.helpDescription}>Contacta con soporte si tienes problemas</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Version info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>TecEnglish v1.0</Text>
        <Text style={styles.footerText}>© 2025 Instituto Tecnológico</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    alignSelf: 'center',
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
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 3,
  },
  userRole: {
    fontSize: 14,
    color: '#6C63FF',
    fontWeight: '500',
    backgroundColor: '#f0f0ff',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 8,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6C63FF',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginHorizontal: 10,
  },
  logoutButton: {
    backgroundColor: '#FF5252',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
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
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  infoItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoIcon: {
    marginRight: 15,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    marginTop: 3,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  helpIcon: {
    marginRight: 15,
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 16,
    color: '#333',
  },
  helpDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  footer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
    padding: 10,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginVertical: 2,
  },
});

export default DocenteProfileScreen;