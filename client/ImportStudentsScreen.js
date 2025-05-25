// ImportStudentsScreen.js
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as XLSX from 'xlsx';
import { bulkCreateUsers } from './apiServiceAdmin';

const ImportStudentsScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [importStatus, setImportStatus] = useState(null);

  const pickExcelFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        copyToCacheDirectory: true
      });
      
      if (result.type === 'success') {
        setIsLoading(true);
        await parseExcelFile(result.uri);
      }
    } catch (error) {
      console.error('Error al seleccionar archivo:', error);
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    }
  };

  const parseExcelFile = async (fileUri) => {
    try {
      const fileContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64
      });
      
      const workbook = XLSX.read(fileContent, { type: 'base64' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convertir a JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      // Validar que el archivo tenga el formato correcto
      if (jsonData.length === 0) {
        Alert.alert('Error', 'El archivo está vacío o no tiene el formato correcto');
        setIsLoading(false);
        return;
      }
      
      // Validar que tenga las columnas necesarias
      const requiredColumns = ['NOMBRE', 'APELLIDO', 'NOCONTROL', 'EMAIL'];
      const firstRow = jsonData[0];
      const missingColumns = requiredColumns.filter(col => !(col in firstRow));
      
      if (missingColumns.length > 0) {
        Alert.alert('Error', `Faltan columnas requeridas: ${missingColumns.join(', ')}`);
        setIsLoading(false);
        return;
      }
      
      // Formato válido, mostrar vista previa
      setParsedData(jsonData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error al procesar archivo Excel:', error);
      Alert.alert('Error', 'No se pudo procesar el archivo Excel');
      setIsLoading(false);
    }
  };

  const handleImportStudents = async () => {
    if (!parsedData || parsedData.length === 0) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Preparar datos para importación
      const studentsToImport = parsedData.map(row => ({
        NOMBRE: row.NOMBRE,
        APELLIDO: row.APELLIDO,
        NOCONTROL: row.NOCONTROL.toString(),
        EMAIL: row.EMAIL,
        PASSWORD: row.PASSWORD || row.NOCONTROL.toString() // Usar NOCONTROL como contraseña por defecto si no se proporciona
      }));
      
      // Llamar al API para crear usuarios en bloque
      const result = await bulkCreateUsers(studentsToImport);
      
      setImportStatus({
        total: studentsToImport.length,
        successful: result.successful,
        failed: result.failed,
        details: result.details
      });
      
      Alert.alert(
        'Importación Completada',
        `Total: ${studentsToImport.length}, Exitosos: ${result.successful}, Fallidos: ${result.failed}`
      );
    } catch (error) {
      console.error('Error al importar estudiantes:', error);
      Alert.alert('Error', 'No se pudieron importar los estudiantes');
    } finally {
      setIsLoading(false);
    }
  };

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
        <Text style={styles.headerTitle}>Importar Estudiantes</Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Instrucciones:</Text>
          <Text style={styles.instructionsText}>
            1. Prepare un archivo Excel con las siguientes columnas:{'\n'}
            • NOMBRE (obligatorio){'\n'}
            • APELLIDO (obligatorio){'\n'}
            • NOCONTROL (obligatorio){'\n'}
            • EMAIL (obligatorio){'\n'}
            • PASSWORD (opcional, si no se proporciona se usará el NOCONTROL)
          </Text>
          <Text style={styles.instructionsText}>
            2. Haga clic en "Seleccionar Archivo" para cargar su Excel.{'\n'}
            3. Revise los datos y haga clic en "Importar" para crear los usuarios.
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.fileButton}
          onPress={pickExcelFile}
          disabled={isLoading}
        >
          <MaterialIcons name="upload-file" size={24} color="white" />
          <Text style={styles.fileButtonText}>Seleccionar Archivo Excel</Text>
        </TouchableOpacity>

        {parsedData && parsedData.length > 0 && (
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>
              Vista Previa ({parsedData.length} estudiantes)
            </Text>
            
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>No. Control</Text>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Nombre</Text>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Email</Text>
            </View>
            
            {parsedData.slice(0, 10).map((student, index) => (
              <View 
                key={`student-${index}`} 
                style={[
                  styles.tableRow,
                  index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd
                ]}
              >
                <Text style={[styles.tableCell, { flex: 1 }]}>{student.NOCONTROL}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{student.NOMBRE} {student.APELLIDO}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{student.EMAIL}</Text>
              </View>
            ))}
            
            {parsedData.length > 10 && (
              <Text style={styles.moreItemsText}>
                ... y {parsedData.length - 10} más
              </Text>
            )}
            
            <TouchableOpacity 
              style={styles.importButton}
              onPress={handleImportStudents}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <MaterialIcons name="group-add" size={24} color="white" />
                  <Text style={styles.importButtonText}>Importar {parsedData.length} Estudiantes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
        
        {importStatus && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Resultado de la Importación</Text>
            <Text style={styles.resultText}>Total: {importStatus.total}</Text>
            <Text style={styles.resultSuccess}>Exitosos: {importStatus.successful}</Text>
            <Text style={styles.resultFailed}>Fallidos: {importStatus.failed}</Text>
            
            {importStatus.failed > 0 && importStatus.details && (
              <View style={styles.failedDetailsContainer}>
                <Text style={styles.failedDetailsTitle}>Detalles de errores:</Text>
                {importStatus.details.map((detail, index) => (
                  <Text key={`error-${index}`} style={styles.failedDetail}>
                    • {detail.NOCONTROL}: {detail.error}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>Procesando archivo...</Text>
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
  content: {
    flex: 1,
    padding: 15,
  },
  instructionsContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
  fileButton: {
    flexDirection: 'row',
    backgroundColor: '#6C63FF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  fileButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
  previewContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#6C63FF',
    padding: 10,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  tableHeaderText: {
    color: 'white',
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableRowEven: {
    backgroundColor: '#f9f9f9',
  },
  tableRowOdd: {
    backgroundColor: 'white',
  },
  tableCell: {
    fontSize: 14,
    color: '#333',
  },
  moreItemsText: {
    textAlign: 'center',
    padding: 10,
    color: '#666',
    fontStyle: 'italic',
  },
  importButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },
  importButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
  resultContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  resultText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  resultSuccess: {
    fontSize: 16,
    color: '#4CAF50',
    marginBottom: 5,
    fontWeight: 'bold',
  },
  resultFailed: {
    fontSize: 16,
    color: '#FF5252',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  failedDetailsContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
  },
  failedDetailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 5,
  },
  failedDetail: {
    fontSize: 14,
    color: '#D32F2F',
    marginBottom: 3,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

export default ImportStudentsScreen;