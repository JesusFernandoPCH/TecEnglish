import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getStats } from './apiServiceAdmin';

// Dimensiones de la pantalla
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const Reports = ({ navigation }) => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState('general');

  // Cargar estadísticas al montar el componente
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

  // Datos simulados para las gráficas (en una implementación real, vendrían del API)
  const mockData = {
    usersByMonth: [
      { month: 'Ene', count: 15 },
      { month: 'Feb', count: 18 },
      { month: 'Mar', count: 25 },
      { month: 'Abr', count: 22 },
      { month: 'May', count: 30 }
    ],
    courseDistribution: [
      { name: 'A1', count: 45 },
      { name: 'A2', count: 38 },
      { name: 'B1', count: 27 },
      { name: 'B2', count: 15 },
      { name: 'C1', count: 5 }
    ],
    examResults: [
      { name: 'Colocación', passed: 85, failed: 15 },
      { name: '4 Habilidades', passed: 68, failed: 32 },
      { name: 'TOEFL', passed: 42, failed: 58 }
    ]
  };

  // Renderizar gráfica de barras sencilla para usuarios por mes
  const renderUsersChart = () => {
    const maxValue = Math.max(...mockData.usersByMonth.map(item => item.count));
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Nuevos Usuarios por Mes</Text>
        <View style={styles.barChart}>
          {mockData.usersByMonth.map((item, index) => (
            <View key={index} style={styles.barItem}>
              <View style={styles.barLabelContainer}>
                <Text style={styles.barValue}>{item.count}</Text>
                <View 
                  style={[
                    styles.bar, 
                    { 
                      height: (item.count / maxValue) * 150,
                      backgroundColor: `rgba(108, 99, 255, ${0.5 + (item.count / maxValue) * 0.5})`
                    }
                  ]} 
                />
                <Text style={styles.barLabel}>{item.month}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Renderizar gráfica de distribución de cursos (circular)
  const renderCoursesChart = () => {
    const total = mockData.courseDistribution.reduce((sum, item) => sum + item.count, 0);
    const colors = ['#6C63FF', '#4CAF50', '#FF9800', '#2196F3', '#9C27B0'];
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Distribución de Alumnos por Nivel</Text>
        <View style={styles.pieChartContainer}>
          <View style={styles.pieChart}>
            {mockData.courseDistribution.map((item, index) => {
              const percent = (item.count / total) * 100;
              return (
                <View key={index} style={styles.pieChartLegendItem}>
                  <View style={[styles.colorBox, { backgroundColor: colors[index % colors.length] }]} />
                  <Text style={styles.pieChartLegendText}>
                    {item.name}: {item.count} ({percent.toFixed(1)}%)
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  // Renderizar gráfica de resultados de exámenes
  const renderExamsChart = () => {
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Resultados de Exámenes</Text>
        <View style={styles.stackedBarChart}>
          {mockData.examResults.map((item, index) => {
            const total = item.passed + item.failed;
            const passedPercent = (item.passed / total) * 100;
            const failedPercent = (item.failed / total) * 100;
            
            return (
              <View key={index} style={styles.stackedBarItem}>
                <Text style={styles.stackedBarLabel}>{item.name}</Text>
                <View style={styles.stackedBarContainer}>
                  <View 
                    style={[
                      styles.stackedBarSegment, 
                      { 
                        width: `${passedPercent}%`,
                        backgroundColor: '#4CAF50'
                      }
                    ]} 
                  />
                  <View 
                    style={[
                      styles.stackedBarSegment, 
                      { 
                        width: `${failedPercent}%`,
                        backgroundColor: '#FF5252'
                      }
                    ]} 
                  />
                </View>
                <View style={styles.stackedBarLegend}>
                  <Text style={styles.stackedBarLegendText}>
                    Aprobados: {passedPercent.toFixed(1)}%
                  </Text>
                  <Text style={styles.stackedBarLegendText}>
                    Reprobados: {failedPercent.toFixed(1)}%
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.legendText}>Aprobados</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FF5252' }]} />
            <Text style={styles.legendText}>Reprobados</Text>
          </View>
        </View>
      </View>
    );
  };

  // Renderizar las tarjetas de información general
  const renderGeneralStats = () => {
    // Si estamos cargando o no tenemos datos, mostrar un loader
    if (isLoading || !stats) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>Cargando estadísticas...</Text>
        </View>
      );
    }

    // En una implementación real, estos datos vendrían del API
    const generalStats = {
      totalUsers: 130,
      activeUsers: 85,
      completedCourses: 320,
      activeExams: 45
    };

    return (
      <View style={styles.statsCardsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statsCard}>
            <MaterialIcons name="people" size={36} color="#6C63FF" />
            <Text style={styles.statsNumber}>{generalStats.totalUsers}</Text>
            <Text style={styles.statsLabel}>Usuarios Totales</Text>
          </View>
          
          <View style={styles.statsCard}>
            <MaterialIcons name="person" size={36} color="#4CAF50" />
            <Text style={styles.statsNumber}>{generalStats.activeUsers}</Text>
            <Text style={styles.statsLabel}>Usuarios Activos</Text>
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statsCard}>
            <MaterialIcons name="school" size={36} color="#2196F3" />
            <Text style={styles.statsNumber}>{generalStats.completedCourses}</Text>
            <Text style={styles.statsLabel}>Cursos Completados</Text>
          </View>
          
          <View style={styles.statsCard}>
            <MaterialIcons name="assignment" size={36} color="#FF9800" />
            <Text style={styles.statsNumber}>{generalStats.activeExams}</Text>
            <Text style={styles.statsLabel}>Exámenes Programados</Text>
          </View>
        </View>
      </View>
    );
  };

  // Renderizar contenido según el reporte seleccionado
  const renderReportContent = () => {
    switch (selectedReport) {
      case 'general':
        return (
          <>
            {renderGeneralStats()}
            {renderUsersChart()}
          </>
        );
      case 'courses':
        return renderCoursesChart();
      case 'exams':
        return renderExamsChart();
      default:
        return null;
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
        <Text style={styles.headerTitle}>Reportes y Estadísticas</Text>
      </LinearGradient>

      <View style={styles.reportTypeTabs}>
        <TouchableOpacity 
          style={[
            styles.reportTypeTab, 
            selectedReport === 'general' && styles.reportTypeTabActive
          ]}
          onPress={() => setSelectedReport('general')}
        >
          <MaterialIcons 
            name="dashboard" 
            size={24} 
            color={selectedReport === 'general' ? '#6C63FF' : '#666'} 
          />
          <Text 
            style={[
              styles.reportTypeText,
              selectedReport === 'general' && styles.reportTypeTextActive
            ]}
          >
            General
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.reportTypeTab, 
            selectedReport === 'courses' && styles.reportTypeTabActive
          ]}
          onPress={() => setSelectedReport('courses')}
        >
          <MaterialIcons 
            name="school" 
            size={24} 
            color={selectedReport === 'courses' ? '#6C63FF' : '#666'} 
          />
          <Text 
            style={[
              styles.reportTypeText,
              selectedReport === 'courses' && styles.reportTypeTextActive
            ]}
          >
            Cursos
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.reportTypeTab, 
            selectedReport === 'exams' && styles.reportTypeTabActive
          ]}
          onPress={() => setSelectedReport('exams')}
        >
          <MaterialIcons 
            name="assignment" 
            size={24} 
            color={selectedReport === 'exams' ? '#6C63FF' : '#666'} 
          />
          <Text 
            style={[
              styles.reportTypeText,
              selectedReport === 'exams' && styles.reportTypeTextActive
            ]}
          >
            Exámenes
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {renderReportContent()}
        
        <TouchableOpacity style={styles.exportButton}>
          <MaterialIcons name="cloud-download" size={20} color="white" />
          <Text style={styles.exportButtonText}>Exportar Reporte</Text>
        </TouchableOpacity>
      </ScrollView>
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
  reportTypeTabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  reportTypeTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  reportTypeTabActive: {
    borderBottomColor: '#6C63FF',
  },
  reportTypeText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  reportTypeTextActive: {
    color: '#6C63FF',
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
    padding: 15,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  statsCardsContainer: {
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statsCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
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
  statsNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 5,
  },
  statsLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 200,
    paddingTop: 20,
  },
  barItem: {
    alignItems: 'center',
  },
  barLabelContainer: {
    alignItems: 'center',
  },
  bar: {
    width: 30,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  barLabel: {
    marginTop: 5,
    fontSize: 12,
    color: '#666',
  },
  barValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  pieChartContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  pieChart: {
    justifyContent: 'center',
  },
  pieChartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  colorBox: {
    width: 15,
    height: 15,
    marginRight: 10,
    borderRadius: 3,
  },
  pieChartLegendText: {
    fontSize: 14,
    color: '#333',
  },
  stackedBarChart: {
    marginTop: 10,
  },
  stackedBarItem: {
    marginBottom: 20,
  },
  stackedBarLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  stackedBarContainer: {
    flexDirection: 'row',
    height: 25,
    borderRadius: 5,
    overflow: 'hidden',
  },
  stackedBarSegment: {
    height: '100%',
  },
  stackedBarLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  stackedBarLegendText: {
    fontSize: 12,
    color: '#666',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  exportButton: {
    flexDirection: 'row',
    backgroundColor: '#6C63FF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  exportButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
});

export default Reports;