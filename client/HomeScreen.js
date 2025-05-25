import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Linking
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// Dimensiones de la pantalla
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Imágenes de ejemplo (puedes reemplazarlas con tus propias imágenes)
const PLACEHOLDER_IMAGES = {
  post1: require('./assets/Cursos-Ingles.jpeg'), // Usa tu logo como placeholder
  post2: require('./assets/Cursos-Ingle.jpeg'),
  post3: require('./assets/Examen-Colocacion.jpeg'),
  post4: require('./assets/Examen-TOFEL.jpeg'),
};

// Datos de las publicaciones
const POST_DATA = [
  {
    id: '1',
    username: 'Departamento de Inglés',
    timestamp: 'Hace 2 horas',
    content: 'Recordatorio: Las inscripciones para el curso intensivo de verano están abiertas hasta el 15 de mayo. ¡No pierdas la oportunidad de avanzar en tu proceso de liberación! Más información en: www.tecinglesliberacion.com',
    image: PLACEHOLDER_IMAGES.post1,
    likes: 24,
    comments: 5,
    shares: 3,
    link: 'https://www.tecinglesliberacion.com'
  },
  {
    id: '2',
    username: 'Coordinación Académica',
    timestamp: 'Hace 1 día',
    content: 'Felicitamos a los alumnos que aprobaron el examen TOEFL la semana pasada. ¡Su esfuerzo ha dado frutos! Próxima fecha de aplicación: 20 de junio. Inscríbete en la oficina de idiomas.',
    image: PLACEHOLDER_IMAGES.post2,
    likes: 56,
    comments: 12,
    shares: 8,
    link: null
  },
  {
    id: '3',
    username: 'Club de Conversación',
    timestamp: 'Hace 3 días',
    content: 'El Club de Conversación en Inglés se reúne todos los miércoles a las 17:00 en el Centro de Idiomas. Esta semana hablaremos sobre tecnología y su impacto en la educación. ¡Todos son bienvenidos! Registro en: forms.tecinglesliberacion.com/clubconversacion',
    image: PLACEHOLDER_IMAGES.post3,
    likes: 18,
    comments: 3,
    shares: 2,
    link: 'https://forms.tecinglesliberacion.com/clubconversacion'
  },
  {
    id: '4',
    username: 'Recursos Educativos',
    timestamp: 'Hace 5 días',
    content: 'Nuevos recursos disponibles en la biblioteca digital para practicar listening y speaking. Accede con tu número de control desde nuestra plataforma: biblioteca.tecinglesliberacion.com',
    image: PLACEHOLDER_IMAGES.post4,
    likes: 42,
    comments: 7,
    shares: 15,
    link: 'https://biblioteca.tecinglesliberacion.com'
  }
];

// Componente para cada publicación
const Post = ({ post }) => {
  // Función para manejar los enlaces
  const handleLinkPress = (url) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  // Función para detectar enlaces en el texto y renderizarlos como clicables
  const renderTextWithLinks = (text) => {
    if (!text) return null;
    
    // Expresión regular simple para detectar URLs
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+\.[^\s]+)/g;
    
    // Dividir el texto en partes (texto normal y enlaces)
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      // Verificar si esta parte es un enlace
      if (part && (part.startsWith('http') || part.startsWith('www.'))) {
        const url = part.startsWith('www.') ? `https://${part}` : part;
        return (
          <Text
            key={index}
            style={styles.linkText}
            onPress={() => handleLinkPress(url)}
          >
            {part}
          </Text>
        );
      }
      return part ? <Text key={index}>{part}</Text> : null;
    });
  };

  return (
    <View style={styles.postContainer}>
      {/* Cabecera de la publicación */}
      <View style={styles.postHeader}>
        <Image
          source={post.image}
          style={styles.postAvatar}
        />
        <View style={styles.postHeaderText}>
          <Text style={styles.postUsername}>{post.username}</Text>
          <Text style={styles.postTimestamp}>{post.timestamp}</Text>
        </View>
        <TouchableOpacity style={styles.postOptions}>
          <MaterialIcons name="more-vert" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Contenido de la publicación */}
      <View style={styles.postContent}>
        <Text style={styles.postText}>
          {renderTextWithLinks(post.content)}
        </Text>
      </View>

      {/* Imagen de la publicación */}
      <Image
        source={post.image}
        style={styles.postImage}
        resizeMode="cover"
      />

      {/* Estadísticas de interacción */}
      <View style={styles.postStats}>
        <View style={styles.postStat}>
          <MaterialIcons name="thumb-up" size={16} color="#6C63FF" />
          <Text style={styles.postStatText}>{post.likes}</Text>
        </View>
        <Text style={styles.postStatDivider}>•</Text>
        <Text style={styles.postStatText}>{post.comments} comentarios</Text>
        <Text style={styles.postStatDivider}>•</Text>
        <Text style={styles.postStatText}>{post.shares} compartidos</Text>
      </View>

      {/* Botones de interacción */}
      <View style={styles.postActions}>
        <TouchableOpacity style={styles.postAction}>
          <MaterialIcons name="thumb-up-off-alt" size={22} color="#666" />
          <Text style={styles.postActionText}>Me gusta</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.postAction}>
          <MaterialIcons name="chat-bubble-outline" size={22} color="#666" />
          <Text style={styles.postActionText}>Comentar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.postAction}>
          <MaterialIcons name="share" size={22} color="#666" />
          <Text style={styles.postActionText}>Compartir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Componente principal del feed
const HomeScreen = () => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerContainer}>
        <Text style={styles.welcomeText}>Novedades y Actualizaciones</Text>
        <Text style={styles.subHeaderText}>
          Mantente informado sobre eventos, recordatorios y recursos para tu proceso de liberación del idioma inglés
        </Text>
      </View>

      {/* Publicaciones */}
      {POST_DATA.map(post => (
        <Post key={post.id} post={post} />
      ))}
      
      {/* Espacio al final para mejor experiencia de scroll */}
      <View style={styles.scrollPadding} />
    </ScrollView>
  );
};

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    padding: 15,
    backgroundColor: 'white',
    marginBottom: 8,
    borderRadius: 10,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subHeaderText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  postContainer: {
    backgroundColor: 'white',
    marginBottom: 8,
    borderRadius: 10,
    overflow: 'hidden',
    margin: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  postHeaderText: {
    flex: 1,
  },
  postUsername: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  postTimestamp: {
    fontSize: 12,
    color: '#666',
  },
  postOptions: {
    padding: 5,
  },
  postContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  postText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  linkText: {
    color: '#6C63FF',
    textDecorationLine: 'underline',
  },
  postImage: {
    width: '100%',
    height: 600,
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postStatText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  postStatDivider: {
    fontSize: 12,
    color: '#666',
    marginHorizontal: 5,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 8,
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
  },
  postActionText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#666',
  },
  scrollPadding: {
    height: 20,
  }
});

export default HomeScreen;