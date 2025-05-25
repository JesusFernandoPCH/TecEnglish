import React, { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView, Alert } from 'react-native';
import { TextInput } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  ActivityIndicator
} from 'react-native';

import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

// Importar servicios de API
import { login, logout, isAuthenticated, getStoredUserData } from './apiService';
import { loginDocente } from './apiServiceDocente';

// Importar pantallas de estudiantes
import ProfileScreen from './ProfileScreen';
import HomeScreen from './HomeScreen';

// Importar pantallas de administrador
import AdminDashboard from './AdminDashboard';
import UserManagement from './UserManagement';
import CourseManagement from './CourseManagement';
import ExamManagement from './ExamManagement';
import StudentDetailScreen from './StudentDetailScreen';

// En App.js, añade estas importaciones en la sección de importaciones
import ImportStudentsScreen from './ImportStudentsScreen';
import BulkCourseAssignment from './BulkCourseAssignment';
import TeacherManagement from './TeacherManagement';

// Importar pantallas de docente
import DocenteHomeScreen from './DocenteHomeScreen';
import DocenteProfileScreen from './DocenteProfileScreen';
import EstudiantesGrupoScreen from './EstudiantesGrupoScreen';
import DocenteCursoManagement from './DocenteCursoManagement';

const appLogoImage = require('./assets/logo.png');

// Obtener dimensiones de la pantalla
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Crear navegación Tab y Stack
const Tab = createBottomTabNavigator();
const AdminStack = createStackNavigator();
const DocenteStack = createStackNavigator();

// Componente para las pestañas de administrador
const AdminTabsScreen = ({ route }) => {
  const { userData, handleLogout } = route.params || {};
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'Dashboard') {
            iconName = 'dashboard';
          } else if (route.name === 'Usuarios') {
            iconName = 'people';
          } else if (route.name === 'Cursos') {
            iconName = 'school';
          } else if (route.name === 'Exámenes') {
            iconName = 'assignment';
          }
          
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6C63FF',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingVertical: 5,
          height: 60,
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 5,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={AdminDashboard} 
        initialParams={{ userData: userData, handleLogout: handleLogout }}
      />
      <Tab.Screen 
        name="Usuarios" 
        component={UserManagement}
        initialParams={{ userData: userData }}
      />
      <Tab.Screen 
        name="Cursos" 
        component={CourseManagement}
        initialParams={{ userData: userData }}
      />
      <Tab.Screen 
        name="Exámenes" 
        component={ExamManagement}
        initialParams={{ userData: userData }}
      />
    </Tab.Navigator>
  );
};

// Componente para las pestañas de docente
const DocenteTabsScreen = ({ route }) => {
  const { userData, handleLogout } = route.params || {};
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'Grupos') {
            iconName = 'groups';
          } else if (route.name === 'Perfil') {
            iconName = 'person';
          }
          
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6C63FF',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingVertical: 5,
          height: 60,
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 5,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Grupos" 
        component={DocenteHomeScreen} 
        initialParams={{ userData }}
      />
      <Tab.Screen 
        name="Perfil" 
        component={DocenteProfileScreen} 
        initialParams={{ userData, handleLogout }}
      />
    </Tab.Navigator>
  );
};

export default function App() {
  // Estados de autenticación 
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAppLoaded, setIsAppLoaded] = useState(false);
  const [userType, setUserType] = useState('estudiante'); // 'estudiante', 'docente', 'admin'
  const [userData, setUserData] = useState(null);

  // Animaciones
  const curtainLeft = useRef(new Animated.Value(0)).current;
  const curtainRight = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Autenticación
  const handleLogin = async () => {
    if (!username || !password) {
      setLoginError('Por favor, ingresa usuario y contraseña');
      shakeAnimation();
      return;
    }
    
    setIsLoading(true);
    setLoginError('');
    
    try {
      let response;
      
      if (userType === 'admin') {
        // Login para administrador
        response = await login(username, password, true);
      } else if (userType === 'docente') {
        // Login para docente
        response = await loginDocente(username, password);
      } else {
        // Login para estudiante
        response = await login(username, password, false);
      }
      
      // Guardar el estado de login
      await AsyncStorage.setItem('isLoggedIn', 'true');
      setUserData(response.user);
      setIsLoggedIn(true);
      
      console.log('Login exitoso:', response.user);
    } catch (error) {
      console.error('Error en login:', error);
      setLoginError(error.message || 'Usuario o contraseña incorrectos');
      shakeAnimation();
    } finally {
      setIsLoading(false);
    }
  };
  
  // Animación de sacudida para errores
  const shakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true })
    ]).start();
  };

  // Animación de apertura de telón
  const startCurtainAnimation = () => {
    // Animar el telón izquierdo
    Animated.timing(curtainLeft, {
      toValue: -SCREEN_WIDTH / 2,
      duration: 1500,
      useNativeDriver: true
    }).start();

    // Animar el telón derecho
    Animated.timing(curtainRight, {
      toValue: SCREEN_WIDTH / 2,
      duration: 1500,
      useNativeDriver: true
    }).start();

    // Animar la aparición del logo
    Animated.sequence([
      Animated.delay(800),
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true
        })
      ])
    ]).start();

    // Animar la aparición del formulario
    Animated.sequence([
      Animated.delay(1200),
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true
      })
    ]).start();
  };

  // Iniciar animaciones de apertura cuando se carga la app
  useEffect(() => {
    // Activar la animación inicial después de un breve retraso
    setTimeout(() => {
      setIsAppLoaded(true);
      startCurtainAnimation();
    }, 500);
  }, []);

  // Verificar estado de login al iniciar
  useEffect(() => {
    const checkLoginState = async () => {
      try {
        // Verificar autenticación con el API
        const authenticated = await isAuthenticated();
        
        if (authenticated) {
          // Recuperar datos guardados del usuario
          const storedUserData = await getStoredUserData();
          if (storedUserData) {
            setUserData(storedUserData);
          }
          
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('Error verificando estado de login:', error);
      }
    };

    checkLoginState();
  }, []);

  // Función para cerrar sesión
  const handleLogout = async () => {
    try {
      await logout();
      setIsLoggedIn(false);
      setUsername('');
      setPassword('');
      setUserData(null);
      setUserType('estudiante');
    } catch (error) {
      Alert.alert('Error', 'No se pudo cerrar sesión correctamente.');
      console.error('Error cerrando sesión:', error);
    }
  };

  // Componente principal
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {!isLoggedIn ? (
        // Pantalla de Login Mejorada
        <View style={styles.loginContainer}>
          {/* Telones animados */}
          <Animated.View 
            style={[
              styles.curtain, 
              styles.curtainLeft, 
              { transform: [{ translateX: curtainLeft }] }
            ]} 
          />
          <Animated.View 
            style={[
              styles.curtain, 
              styles.curtainRight, 
              { transform: [{ translateX: curtainRight }] }
            ]} 
          />

          <LinearGradient
            colors={['#6C63FF', '#4158D0']}
            style={styles.loginHeader}
          >
            <Text style={styles.loginTitle}>TecEnglish</Text>
            <Text style={styles.loginSubtitle}>
              {userType === 'estudiante' ? 'Acceso para Estudiantes' : 
               userType === 'docente' ? 'Acceso para Docentes' : 
               'Acceso para Administradores'}
            </Text>
          </LinearGradient>

          <View style={styles.loginContent}>
            {/* Logo central animado */}
            <Animated.View 
              style={[
                styles.logoContainer,
                {
                  opacity: logoOpacity,
                  transform: [{ scale: logoScale }]
                }
              ]}
            >
              <Image 
                source={appLogoImage} 
                style={styles.appLogo}
                resizeMode="contain"
              />
              <Text style={styles.appTagline}>Departamento de Lenguas Extranjeras</Text>
            </Animated.View>

            {/* Formulario de login animado */}
            <Animated.View 
              style={[
                styles.loginForm,
                { opacity: formOpacity }
              ]}
            >
              <Animated.View 
                style={[
                  styles.inputContainer,
                  loginError ? { transform: [{ translateX: shakeAnim }] } : {}
                ]}
              >
                <MaterialIcons name="person" size={24} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={userType === 'estudiante' ? "No. Control" : 
                               userType === 'docente' ? "Email" : 
                               "Email"}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </Animated.View>

              <Animated.View 
                style={[
                  styles.inputContainer,
                  loginError ? { transform: [{ translateX: shakeAnim }] } : {}
                ]}
              >
                <MaterialIcons name="lock" size={24} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Contraseña"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </Animated.View>

              {loginError ? (
                <Text style={styles.errorText}>{loginError}</Text>
              ) : null}

              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.disabledButton]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.toggleModeButton}
                onPress={() => {
                  if (userType === 'estudiante') {
                    setUserType('docente');
                  } else if (userType === 'docente') {
                    setUserType('admin');
                  } else {
                    setUserType('estudiante');
                  }
                  setUsername('');
                  setPassword('');
                  setLoginError('');
                }}
              >
                <Text style={styles.toggleModeText}>
                  {userType === 'estudiante' ? "Acceso para Docentes" : 
                   userType === 'docente' ? "Cambiar acceso para Administradores" : 
                   "Acceso para Estudiantes"}
                </Text>
              </TouchableOpacity>
              
              <Text style={styles.loginHint}>No dejes el Inglés para el Final!!!</Text>
            </Animated.View>
          </View>
        </View>
      ) : (
        // Navegación de pestañas después del login
        <NavigationContainer>
          <LinearGradient
            colors={['#6C63FF', '#4158D0']}
            style={styles.homeHeader}
          >
            <Text style={styles.homeTitle}>
              {userData?.isAdmin ? 'Panel de Administración' : 
               userData?.isDocente ? 'Portal Docente' :
               'Liberación del Inglés'}
            </Text>
            {userData && (
              <Text style={styles.welcomeUser}>
                ¡Hola, {userData.nombre}!
              </Text>
            )}
          </LinearGradient>
          
          {userData?.isAdmin ? (
            // Navegación para administradores
            <AdminStack.Navigator screenOptions={{ headerShown: false }}>
              <AdminStack.Screen 
                name="AdminTabs" 
                component={AdminTabsScreen} 
                initialParams={{ userData: userData, handleLogout: handleLogout }}
              />
              <AdminStack.Screen name="StudentDetail" component={StudentDetailScreen} />
              <AdminStack.Screen name="ImportStudents" component={ImportStudentsScreen} />
              <AdminStack.Screen name="BulkCourseAssignment" component={BulkCourseAssignment} />
              <AdminStack.Screen name="TeacherManagement" component={TeacherManagement} />
              <AdminStack.Screen name="DocenteCursoManagement" component={DocenteCursoManagement} />
            </AdminStack.Navigator>
          ) : userData?.isDocente ? (
            // Navegación para docentes
            <DocenteStack.Navigator screenOptions={{ headerShown: false }}>
              <DocenteStack.Screen 
                name="DocenteTabs" 
                component={DocenteTabsScreen} 
                initialParams={{ userData, handleLogout }}
              />
              <DocenteStack.Screen name="EstudiantesGrupo" component={EstudiantesGrupoScreen} />
            </DocenteStack.Navigator>
          ) : (
            // Navegación para estudiantes
            <Tab.Navigator
              screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                  let iconName;
                  
                  if (route.name === 'Inicio') {
                    iconName = focused ? 'home' : 'home-outline';
                  } else if (route.name === 'Perfil') {
                    iconName = focused ? 'person' : 'person-outline';
                  }
                  
                  return <MaterialIcons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#6C63FF',
                tabBarInactiveTintColor: 'gray',
                tabBarStyle: {
                  paddingVertical: 5,
                  height: 60,
                  borderTopWidth: 0,
                  elevation: 10,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: -3 },
                  shadowOpacity: 0.1,
                  shadowRadius: 5,
                },
                tabBarLabelStyle: {
                  fontSize: 12,
                  marginBottom: 5,
                },
                headerShown: false,
              })}
            >
              <Tab.Screen 
                name="Inicio" 
                component={HomeScreen} 
                initialParams={{ userData: userData }}
              />
              <Tab.Screen 
                name="Perfil" 
                component={ProfileScreen} 
                initialParams={{ 
                  userData: userData,
                  handleLogout: handleLogout 
                }}
              />
            </Tab.Navigator>
          )}
        </NavigationContainer>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loginContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  curtain: {
    position: 'absolute',
    top: 0,
    height: SCREEN_HEIGHT,
    width: SCREEN_WIDTH / 2,
    backgroundColor: '#6C63FF',
    zIndex: 10,
  },
  curtainLeft: {
    left: 0,
  },
  curtainRight: {
    right: 0,
  },
  loginHeader: {
    paddingTop: Platform.OS === 'ios' ? 0 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  loginSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  loginContent: {
    flex: 1,
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  appLogo: {
    width: 150,
    height: 150,
    marginBottom: 10,
  },
  appTagline: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loginForm: {
    marginTop: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 55,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  errorText: {
    color: '#FF5252',
    marginBottom: 15,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 10,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#6C63FF',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#A5A5A5',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  toggleModeButton: {
    marginTop: 10,
    alignItems: 'center',
    fontWeight: 'bold',
    backgroundColor: '#6C63FF',
    borderRadius: 10,
    height: 55,
    justifyContent: 'center',
    marginBottom: 15,
    shadowColor: '#6C63FF',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  toggleModeText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  loginHint: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 30,
    fontStyle: 'italic',
  },
  homeHeader: {
    paddingTop: Platform.OS === 'ios' ? 0 : 40,
    paddingBottom: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  homeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  welcomeUser: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 5,
  },
});