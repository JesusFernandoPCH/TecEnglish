import mysql from "mysql2";
import dotenv from "dotenv";
dotenv.config();

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
})
.promise();

// Autenticación de usuarios
export async function getUserByNoControl(noControl) {
  const [rows] = await pool.query('SELECT * FROM USUARIO WHERE NOCONTROL = ?', [noControl]);
  return rows[0];
}

// Autenticación de administradores
export async function getAdminByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM ADMINISTRADOR WHERE EMAIL = ?', [email]);
  return rows[0];
}

// Obtener perfil de usuario completo
export async function getUserProfile(userId) {
  const [userData] = await pool.query('SELECT * FROM USUARIO WHERE ID = ?', [userId]);
  
  if (!userData[0]) return null;
  
  // Obtener cursos del usuario
  const [userCourses] = await pool.query(`
    SELECT UC.*, NC.NOMBRE 
    FROM USUARIO_CURSO UC 
    JOIN NIVEL_CURSO NC ON UC.ID_NIVEL_CURSO = NC.ID 
    WHERE UC.ID_USUARIO = ?
  `, [userId]);
  
  // Obtener exámenes del usuario
  const [userExams] = await pool.query(`
    SELECT UE.*, TE.NOMBRE 
    FROM USUARIO_EXAMEN UE 
    JOIN TIPO_EXAMEN TE ON UE.ID_TIPO_EXAMEN = TE.ID 
    WHERE UE.ID_USUARIO = ?
  `, [userId]);
  
  return {
    user: userData[0],
    courses: userCourses,
    exams: userExams
  };
}

// Obtener curso actual del usuario
export async function getCurrentCourse(userId) {
  const [rows] = await pool.query(`
    SELECT UC.*, NC.NOMBRE 
    FROM USUARIO_CURSO UC 
    JOIN NIVEL_CURSO NC ON UC.ID_NIVEL_CURSO = NC.ID 
    WHERE UC.ID_USUARIO = ? AND UC.ESTADO = 'En curso'
  `, [userId]);
  
  return rows[0];
}

// Autenticación de docentes
export async function getDocenteByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM DOCENTE WHERE EMAIL = ?', [email]);
  return rows[0];
}

// Obtener grupos asignados a un docente
export async function getGruposDocente(docenteId) {
  const [rows] = await pool.query(`
    SELECT DC.ID, DC.GRUPO, DC.PERIODO, DC.FECHA_INICIO, DC.FECHA_FIN,
           NC.ID AS ID_NIVEL_CURSO, NC.NOMBRE AS NOMBRE_CURSO, NC.DESCRIPCION
    FROM DOCENTE_CURSO DC
    JOIN NIVEL_CURSO NC ON DC.ID_NIVEL_CURSO = NC.ID
    WHERE DC.ID_DOCENTE = ?
    ORDER BY DC.FECHA_INICIO DESC
  `, [docenteId]);
  
  return rows;
}

// Obtener estudiantes de un grupo específico
export async function getEstudiantesGrupo(docenteCursoId) {
  const [rows] = await pool.query(`
    SELECT U.ID, U.NOMBRE, U.APELLIDO, U.NOCONTROL, 
           CC.CALIFICACION, CC.COMENTARIO, CC.FECHA_CALIFICACION, CC.ID AS ID_CALIFICACION
    FROM USUARIO U
    LEFT JOIN CALIFICACION_CURSO CC ON U.ID = CC.ID_USUARIO AND CC.ID_DOCENTE_CURSO = ?
    JOIN USUARIO_CURSO UC ON U.ID = UC.ID_USUARIO
    JOIN DOCENTE_CURSO DC ON UC.ID_NIVEL_CURSO = DC.ID_NIVEL_CURSO
    WHERE DC.ID = ?
    ORDER BY U.APELLIDO, U.NOMBRE
  `, [docenteCursoId, docenteCursoId]);
  
  return rows;
}

// Actualizar calificaciones de los estudiantes
export async function updateCalificacionEstudiante(calificacionData) {
  const { ID_USUARIO, ID_DOCENTE_CURSO, CALIFICACION, COMENTARIO } = calificacionData;
  
  try {
    // Iniciar transacción para actualizar ambas tablas
    await pool.query('START TRANSACTION');
    
    // Verificar si ya existe una calificación para actualizar o crear nueva
    const [existingCalif] = await pool.query(
      'SELECT ID FROM CALIFICACION_CURSO WHERE ID_USUARIO = ? AND ID_DOCENTE_CURSO = ?',
      [ID_USUARIO, ID_DOCENTE_CURSO]
    );
    
    let califId;
    if (existingCalif.length > 0) {
      // Actualizar calificación existente
      await pool.query(
        'UPDATE CALIFICACION_CURSO SET CALIFICACION = ?, COMENTARIO = ?, FECHA_CALIFICACION = CURRENT_TIMESTAMP WHERE ID = ?',
        [CALIFICACION, COMENTARIO, existingCalif[0].ID]
      );
      califId = existingCalif[0].ID;
    } else {
      // Crear nueva calificación
      const [result] = await pool.query(
        'INSERT INTO CALIFICACION_CURSO (ID_USUARIO, ID_DOCENTE_CURSO, CALIFICACION, COMENTARIO) VALUES (?, ?, ?, ?)',
        [ID_USUARIO, ID_DOCENTE_CURSO, CALIFICACION, COMENTARIO]
      );
      califId = result.insertId;
    }
    
    // Obtener el ID_NIVEL_CURSO del DOCENTE_CURSO
    const [cursoInfo] = await pool.query(
      'SELECT ID_NIVEL_CURSO FROM DOCENTE_CURSO WHERE ID = ?',
      [ID_DOCENTE_CURSO]
    );
    
    if (cursoInfo.length > 0) {
      const ID_NIVEL_CURSO = cursoInfo[0].ID_NIVEL_CURSO;
      
      // Actualizar la tabla USUARIO_CURSO
      await pool.query(
        'UPDATE USUARIO_CURSO SET CALIFICACION = ? WHERE ID_USUARIO = ? AND ID_NIVEL_CURSO = ?',
        [CALIFICACION, ID_USUARIO, ID_NIVEL_CURSO]
      );
    }
    
    // Confirmar los cambios
    await pool.query('COMMIT');
    
    return califId;
  } catch (error) {
    // Si hay un error, deshacer los cambios
    await pool.query('ROLLBACK');
    console.error('Error en updateCalificacionEstudiante:', error);
    throw error;
  }
}

// Función para crear múltiples usuarios en bloque
export async function bulkCreateUsers(usersData) {
  const results = {
    successful: 0,
    failed: 0,
    details: []
  };
  
  // Iniciar transacción para garantizar consistencia
  await pool.query('START TRANSACTION');
  
  try {
    for (const userData of usersData) {
      try {
        // Verificar si el usuario ya existe
        const [existingUser] = await pool.query(
          'SELECT ID FROM USUARIO WHERE NOCONTROL = ?', 
          [userData.NOCONTROL]
        );
        
        if (existingUser.length > 0) {
          // Usuario ya existe
          results.failed++;
          results.details.push({
            NOCONTROL: userData.NOCONTROL,
            error: 'El número de control ya está registrado'
          });
          continue;
        }
        
        // Insertar nuevo usuario
        await pool.query(
          'INSERT INTO USUARIO (NOMBRE, APELLIDO, PASSWORD, NOCONTROL, EMAIL, ID_ADMINISTRADOR) VALUES (?, ?, ?, ?, ?, ?)',
          [
            userData.NOMBRE, 
            userData.APELLIDO, 
            userData.PASSWORD || userData.NOCONTROL, // Si no hay contraseña, usar NOCONTROL
            userData.NOCONTROL,
            userData.EMAIL,
            1 // ID del administrador por defecto
          ]
        );
        
        results.successful++;
      } catch (err) {
        results.failed++;
        results.details.push({
          NOCONTROL: userData.NOCONTROL,
          error: err.message
        });
      }
    }
    
    // Si todo salió bien, confirmar los cambios
    await pool.query('COMMIT');
    return results;
  } catch (error) {
    // Si hubo un error, revertir los cambios
    await pool.query('ROLLBACK');
    throw error;
  }
}

// Obtener asignaciones de docentes a cursos
export async function getDocenteCursoAssignments() {
  const [rows] = await pool.query(`
    SELECT DC.*, 
           D.NOMBRE AS NOMBRE_DOCENTE, D.APELLIDO AS APELLIDO_DOCENTE, D.EMAIL AS EMAIL_DOCENTE,
           NC.NOMBRE AS NOMBRE_CURSO, NC.DESCRIPCION AS DESCRIPCION_CURSO
    FROM DOCENTE_CURSO DC
    JOIN DOCENTE D ON DC.ID_DOCENTE = D.ID
    JOIN NIVEL_CURSO NC ON DC.ID_NIVEL_CURSO = NC.ID
    ORDER BY DC.PERIODO DESC, NC.NOMBRE
  `);
  
  return rows;
}

// Crear una nueva asignación docente-curso
export async function createDocenteCursoAssignment(assignmentData) {
  const { ID_DOCENTE, ID_NIVEL_CURSO, GRUPO, PERIODO, FECHA_INICIO, FECHA_FIN } = assignmentData;
  
  // Verificar si ya existe una asignación idéntica
  const [existingAssignment] = await pool.query(
    'SELECT * FROM DOCENTE_CURSO WHERE ID_DOCENTE = ? AND ID_NIVEL_CURSO = ? AND GRUPO = ? AND PERIODO = ?',
    [ID_DOCENTE, ID_NIVEL_CURSO, GRUPO, PERIODO]
  );
  
  if (existingAssignment.length > 0) {
    throw new Error("Ya existe una asignación idéntica para este docente, curso, grupo y periodo");
  }
  
  const [result] = await pool.query(
    'INSERT INTO DOCENTE_CURSO (ID_DOCENTE, ID_NIVEL_CURSO, GRUPO, PERIODO, FECHA_INICIO, FECHA_FIN) VALUES (?, ?, ?, ?, ?, ?)',
    [ID_DOCENTE, ID_NIVEL_CURSO, GRUPO, PERIODO, FECHA_INICIO, FECHA_FIN]
  );
  
  // Obtener la asignación completa con información relacionada
  const [newAssignment] = await pool.query(`
    SELECT DC.*, 
           D.NOMBRE AS NOMBRE_DOCENTE, D.APELLIDO AS APELLIDO_DOCENTE, D.EMAIL AS EMAIL_DOCENTE,
           NC.NOMBRE AS NOMBRE_CURSO, NC.DESCRIPCION AS DESCRIPCION_CURSO
    FROM DOCENTE_CURSO DC
    JOIN DOCENTE D ON DC.ID_DOCENTE = D.ID
    JOIN NIVEL_CURSO NC ON DC.ID_NIVEL_CURSO = NC.ID
    WHERE DC.ID = ?
  `, [result.insertId]);
  
  return newAssignment[0];
}

// Actualizar una asignación docente-curso
export async function updateDocenteCursoAssignment(assignmentId, assignmentData) {
  const { GRUPO, PERIODO, FECHA_INICIO, FECHA_FIN } = assignmentData;
  
  await pool.query(
    'UPDATE DOCENTE_CURSO SET GRUPO = ?, PERIODO = ?, FECHA_INICIO = ?, FECHA_FIN = ? WHERE ID = ?',
    [GRUPO, PERIODO, FECHA_INICIO, FECHA_FIN, assignmentId]
  );
  
  // Obtener la asignación actualizada
  const [updatedAssignment] = await pool.query(`
    SELECT DC.*, 
           D.NOMBRE AS NOMBRE_DOCENTE, D.APELLIDO AS APELLIDO_DOCENTE, D.EMAIL AS EMAIL_DOCENTE,
           NC.NOMBRE AS NOMBRE_CURSO, NC.DESCRIPCION AS DESCRIPCION_CURSO
    FROM DOCENTE_CURSO DC
    JOIN DOCENTE D ON DC.ID_DOCENTE = D.ID
    JOIN NIVEL_CURSO NC ON DC.ID_NIVEL_CURSO = NC.ID
    WHERE DC.ID = ?
  `, [assignmentId]);
  
  return updatedAssignment[0];
}

// Eliminar una asignación docente-curso
export async function deleteDocenteCursoAssignment(assignmentId) {
  // Verificar si hay calificaciones asociadas a esta asignación
  const [calificaciones] = await pool.query(
    'SELECT COUNT(*) AS total FROM CALIFICACION_CURSO WHERE ID_DOCENTE_CURSO = ?',
    [assignmentId]
  );
  
  // Si hay calificaciones, preguntar si realmente desea eliminar
  if (calificaciones[0].total > 0) {
    throw new Error(`Existen ${calificaciones[0].total} calificaciones asociadas a esta asignación. ¿Está seguro de eliminarla?`);
  }
  
  await pool.query('DELETE FROM DOCENTE_CURSO WHERE ID = ?', [assignmentId]);
  return true;
}

// Asignar curso a múltiples usuarios en bloque
export async function bulkAssignCourseToUsers(assignmentData) {
  const { userIds, courseId, ESTADO, FECHA_INICIO, FECHA_FIN, CALIFICACION = null } = assignmentData;
  
  const results = {
    successful: 0,
    failed: 0,
    details: []
  };
  
  // Iniciar transacción
  await pool.query('START TRANSACTION');
  
  try {
    for (const userId of userIds) {
      try {
        // Verificar si ya existe la asignación
        const [existingAssignment] = await pool.query(
          'SELECT * FROM USUARIO_CURSO WHERE ID_USUARIO = ? AND ID_NIVEL_CURSO = ?',
          [userId, courseId]
        );
        
        if (existingAssignment.length > 0) {
          // Actualizar asignación existente
          await pool.query(
            'UPDATE USUARIO_CURSO SET CALIFICACION = ?, ESTADO = ?, FECHA_INICIO = ?, FECHA_FIN = ? WHERE ID_USUARIO = ? AND ID_NIVEL_CURSO = ?',
            [CALIFICACION, ESTADO, FECHA_INICIO, FECHA_FIN, userId, courseId]
          );
        } else {
          // Crear nueva asignación
          await pool.query(
            'INSERT INTO USUARIO_CURSO (ID_USUARIO, ID_NIVEL_CURSO, CALIFICACION, ESTADO, FECHA_INICIO, FECHA_FIN) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, courseId, CALIFICACION, ESTADO, FECHA_INICIO, FECHA_FIN]
          );
        }
        
        // Actualizar también la tabla CALIFICACION_CURSO si aplica
        if (ESTADO === 'Completado' && CALIFICACION !== null) {
          // Obtener los IDs de DOCENTE_CURSO asociados con este NIVEL_CURSO
          const [docenteCursos] = await pool.query(
            'SELECT ID FROM DOCENTE_CURSO WHERE ID_NIVEL_CURSO = ?',
            [courseId]
          );
          
          if (docenteCursos.length > 0) {
            for (const docenteCurso of docenteCursos) {
              // Verificar si ya existe una calificación para actualizar o crear nueva
              const [existingCalif] = await pool.query(
                'SELECT ID FROM CALIFICACION_CURSO WHERE ID_USUARIO = ? AND ID_DOCENTE_CURSO = ?',
                [userId, docenteCurso.ID]
              );
              
              if (existingCalif.length > 0) {
                // Actualizar calificación existente
                await pool.query(
                  'UPDATE CALIFICACION_CURSO SET CALIFICACION = ?, FECHA_CALIFICACION = CURRENT_TIMESTAMP WHERE ID = ?',
                  [CALIFICACION, existingCalif[0].ID]
                );
              } else {
                // Crear nueva calificación
                await pool.query(
                  'INSERT INTO CALIFICACION_CURSO (ID_USUARIO, ID_DOCENTE_CURSO, CALIFICACION) VALUES (?, ?, ?)',
                  [userId, docenteCurso.ID, CALIFICACION]
                );
              }
            }
          }
        }
        
        results.successful++;
      } catch (err) {
        results.failed++;
        results.details.push({
          userId,
          error: err.message
        });
      }
    }
    
    // Confirmar cambios
    await pool.query('COMMIT');
    return results;
  } catch (error) {
    // Revertir cambios en caso de error
    await pool.query('ROLLBACK');
    throw error;
  }
}

// Eliminar asignaciones de curso a múltiples usuarios en bloque
export async function bulkRemoveCourseFromUsers(removalData) {
  const { userIds, courseId } = removalData;
  
  const results = {
    successful: 0,
    failed: 0,
    details: []
  };
  
  // Iniciar transacción
  await pool.query('START TRANSACTION');
  
  try {
    for (const userId of userIds) {
      try {
        // Eliminar asignación de curso
        const [result] = await pool.query(
          'DELETE FROM USUARIO_CURSO WHERE ID_USUARIO = ? AND ID_NIVEL_CURSO = ?',
          [userId, courseId]
        );
        
        if (result.affectedRows > 0) {
          // También eliminar calificaciones asociadas
          // Obtener los IDs de DOCENTE_CURSO asociados con este NIVEL_CURSO
          const [docenteCursos] = await pool.query(
            'SELECT ID FROM DOCENTE_CURSO WHERE ID_NIVEL_CURSO = ?',
            [courseId]
          );
          
          if (docenteCursos.length > 0) {
            for (const docenteCurso of docenteCursos) {
              await pool.query(
                'DELETE FROM CALIFICACION_CURSO WHERE ID_USUARIO = ? AND ID_DOCENTE_CURSO = ?',
                [userId, docenteCurso.ID]
              );
            }
          }
          
          results.successful++;
        } else {
          results.failed++;
          results.details.push({
            userId,
            error: 'No se encontró la asignación'
          });
        }
      } catch (err) {
        results.failed++;
        results.details.push({
          userId,
          error: err.message
        });
      }
    }
    
    // Confirmar cambios
    await pool.query('COMMIT');
    return results;
  } catch (error) {
    // Revertir cambios en caso de error
    await pool.query('ROLLBACK');
    throw error;
  }
}

// Obtener lista de docentes
export async function getAllTeachers() {
  const [rows] = await pool.query('SELECT * FROM DOCENTE ORDER BY NOMBRE, APELLIDO');
  return rows;
}

// Crear un nuevo docente
export async function createTeacher(teacherData) {
  const { NOMBRE, APELLIDO, EMAIL, PASSWORD } = teacherData;
  
  // Verificar que el email no esté repetido
  const [existingTeacher] = await pool.query('SELECT * FROM DOCENTE WHERE EMAIL = ?', [EMAIL]);
  if (existingTeacher.length > 0) {
    throw new Error("El email ya está registrado");
  }
  
  const [result] = await pool.query(
    'INSERT INTO DOCENTE (NOMBRE, APELLIDO, PASSWORD, EMAIL) VALUES (?, ?, ?, ?)',
    [NOMBRE, APELLIDO, PASSWORD, EMAIL]
  );
  
  const [newTeacher] = await pool.query('SELECT * FROM DOCENTE WHERE ID = ?', [result.insertId]);
  return newTeacher[0];
}

// Actualizar un docente existente
export async function updateTeacher(teacherId, teacherData) {
  const { NOMBRE, APELLIDO, EMAIL, PASSWORD } = teacherData;
  
  if (EMAIL) {
    // Verificar que el email no esté en uso por otro docente
    const [existingTeacher] = await pool.query(
      'SELECT * FROM DOCENTE WHERE EMAIL = ? AND ID != ?', 
      [EMAIL, teacherId]
    );
    if (existingTeacher.length > 0) {
      throw new Error("El email ya está registrado por otro docente");
    }
  }
  
  let query = 'UPDATE DOCENTE SET NOMBRE = ?, APELLIDO = ?, EMAIL = ?';
  let params = [NOMBRE, APELLIDO, EMAIL];
  
  if (PASSWORD) {
    query += ', PASSWORD = ?';
    params.push(PASSWORD);
  }
  
  query += ' WHERE ID = ?';
  params.push(teacherId);
  
  await pool.query(query, params);
  
  const [updatedTeacher] = await pool.query('SELECT * FROM DOCENTE WHERE ID = ?', [teacherId]);
  return updatedTeacher[0];
}

// Eliminar un docente
export async function deleteTeacher(teacherId) {
  // Verificar si tiene grupos asignados
  const [assignedGroups] = await pool.query(
    'SELECT * FROM DOCENTE_CURSO WHERE ID_DOCENTE = ?', 
    [teacherId]
  );
  
  if (assignedGroups.length > 0) {
    throw new Error("No se puede eliminar el docente porque tiene grupos asignados");
  }
  
  await pool.query('DELETE FROM DOCENTE WHERE ID = ?', [teacherId]);
  return true;
}

// Obtener todas las calificaciones de un grupo para exportación
export async function getCalificacionesGrupoParaExportar(docenteCursoId) {
  const [rows] = await pool.query(`
    SELECT 
      U.NOCONTROL, 
      U.NOMBRE, 
      U.APELLIDO, 
      COALESCE(CC.CALIFICACION, 'No evaluado') AS CALIFICACION,
      COALESCE(CC.COMENTARIO, '') AS COMENTARIO,
      DC.GRUPO,
      NC.NOMBRE AS NIVEL_CURSO,
      DC.PERIODO
    FROM USUARIO U
    LEFT JOIN CALIFICACION_CURSO CC ON U.ID = CC.ID_USUARIO AND CC.ID_DOCENTE_CURSO = ?
    JOIN USUARIO_CURSO UC ON U.ID = UC.ID_USUARIO
    JOIN DOCENTE_CURSO DC ON UC.ID_NIVEL_CURSO = DC.ID_NIVEL_CURSO
    JOIN NIVEL_CURSO NC ON DC.ID_NIVEL_CURSO = NC.ID
    WHERE DC.ID = ?
    ORDER BY U.APELLIDO, U.NOMBRE
  `, [docenteCursoId, docenteCursoId]);
  
  return rows;
}

// Obtener todos los niveles de cursos
export async function getAllCourses() {
  const [rows] = await pool.query('SELECT * FROM NIVEL_CURSO');
  return rows;
}

// Obtener todos los tipos de exámenes
export async function getAllExamTypes() {
  const [rows] = await pool.query('SELECT * FROM TIPO_EXAMEN');
  return rows;
}

// Actualizar datos de perfil
export async function updateUserProfile(userId, userData) {
  const { NOMBRE, APELLIDO, EMAIL } = userData;
  
  await pool.query(
    'UPDATE USUARIO SET NOMBRE = ?, APELLIDO = ?, EMAIL = ? WHERE ID = ?',
    [NOMBRE, APELLIDO, EMAIL, userId]
  );
  
  return await getUserProfile(userId);
}

// Cambiar contraseña
export async function updateUserPassword(userId, newPassword) {
  await pool.query(
    'UPDATE USUARIO SET PASSWORD = ? WHERE ID = ?',
    [newPassword, userId]
  );
  
  return true;
}

// Obtener publicaciones/anuncios
export async function getPosts() {
  // Esta función simula obtener publicaciones de una base de datos
  // En una implementación real, deberías tener una tabla para posts
  return [
    {
      id: '1',
      username: 'Departamento de Inglés',
      timestamp: 'Hace 2 horas',
      content: 'Recordatorio: Las inscripciones para el curso intensivo de verano están abiertas hasta el 15 de mayo. ¡No pierdas la oportunidad de avanzar en tu proceso de liberación! Más información en: www.tecinglesliberacion.com',
      image_url: null,
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
      image_url: null,
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
      image_url: null,
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
      image_url: null,
      likes: 42,
      comments: 7,
      shares: 15,
      link: 'https://biblioteca.tecinglesliberacion.com'
    }
  ];
}

// ===== FUNCIONES DE ADMINISTRADOR =====

// Obtener todos los usuarios
export async function getAllUsers() {
  const [rows] = await pool.query('SELECT * FROM USUARIO');
  return rows;
}

// Crear un nuevo usuario
export async function createUserAdmin(userData) {
  const { NOMBRE, APELLIDO, PASSWORD, NOCONTROL, EMAIL, ID_ADMINISTRADOR } = userData;
  
  // Verificar que el número de control no esté repetido
  const [existingUser] = await pool.query('SELECT * FROM USUARIO WHERE NOCONTROL = ?', [NOCONTROL]);
  if (existingUser.length > 0) {
    throw new Error("El número de control ya está registrado");
  }
  
  const [result] = await pool.query(
    'INSERT INTO USUARIO (NOMBRE, APELLIDO, PASSWORD, NOCONTROL, EMAIL, ID_ADMINISTRADOR) VALUES (?, ?, ?, ?, ?, ?)',
    [NOMBRE, APELLIDO, PASSWORD, NOCONTROL, EMAIL, ID_ADMINISTRADOR]
  );
  
  const [newUser] = await pool.query('SELECT * FROM USUARIO WHERE ID = ?', [result.insertId]);
  return newUser[0];
}

// Actualizar un usuario
export async function updateUserAdmin(userId, userData) {
  const { NOMBRE, APELLIDO, EMAIL, PASSWORD } = userData;
  
  let query = 'UPDATE USUARIO SET NOMBRE = ?, APELLIDO = ?, EMAIL = ?';
  let params = [NOMBRE, APELLIDO, EMAIL];
  
  if (PASSWORD) {
    query += ', PASSWORD = ?';
    params.push(PASSWORD);
  }
  
  query += ' WHERE ID = ?';
  params.push(userId);
  
  await pool.query(query, params);
  
  const [updatedUser] = await pool.query('SELECT * FROM USUARIO WHERE ID = ?', [userId]);
  return updatedUser[0];
}

// Eliminar un usuario
export async function deleteUserAdmin(userId) {
  // Eliminar registros relacionados primero
  await pool.query('DELETE FROM USUARIO_CURSO WHERE ID_USUARIO = ?', [userId]);
  await pool.query('DELETE FROM USUARIO_EXAMEN WHERE ID_USUARIO = ?', [userId]);
  
  // Eliminar el usuario
  await pool.query('DELETE FROM USUARIO WHERE ID = ?', [userId]);
  return true;
}

// Obtener todos los cursos (para administrador)
export async function getAllCoursesAdmin() {
  const [rows] = await pool.query('SELECT * FROM NIVEL_CURSO');
  return rows;
}

// Crear un nuevo curso
export async function createCourseAdmin(courseData) {
  const { NOMBRE, DESCRIPCION } = courseData;
  
  // Verificar que el nombre no esté repetido
  const [existingCourse] = await pool.query('SELECT * FROM NIVEL_CURSO WHERE NOMBRE = ?', [NOMBRE]);
  if (existingCourse.length > 0) {
    throw new Error("Ya existe un curso con ese nombre");
  }
  
  const [result] = await pool.query(
    'INSERT INTO NIVEL_CURSO (NOMBRE, DESCRIPCION) VALUES (?, ?)',
    [NOMBRE, DESCRIPCION]
  );
  
  const [newCourse] = await pool.query('SELECT * FROM NIVEL_CURSO WHERE ID = ?', [result.insertId]);
  return newCourse[0];
}

// Actualizar un curso
export async function updateCourseAdmin(courseId, courseData) {
  const { NOMBRE, DESCRIPCION } = courseData;
  
  await pool.query(
    'UPDATE NIVEL_CURSO SET NOMBRE = ?, DESCRIPCION = ? WHERE ID = ?',
    [NOMBRE, DESCRIPCION, courseId]
  );
  
  const [updatedCourse] = await pool.query('SELECT * FROM NIVEL_CURSO WHERE ID = ?', [courseId]);
  return updatedCourse[0];
}

// Eliminar un curso
export async function deleteCourseAdmin(courseId) {
  // Verificar si hay usuarios asignados a este curso
  const [assignedUsers] = await pool.query('SELECT * FROM USUARIO_CURSO WHERE ID_NIVEL_CURSO = ?', [courseId]);
  if (assignedUsers.length > 0) {
    throw new Error("No se puede eliminar el curso porque hay usuarios asignados");
  }
  
  await pool.query('DELETE FROM NIVEL_CURSO WHERE ID = ?', [courseId]);
  return true;
}

// Obtener todos los exámenes (para administrador)
export async function getAllExamsAdmin() {
  const [rows] = await pool.query('SELECT * FROM TIPO_EXAMEN');
  return rows;
}

// Crear un nuevo examen
export async function createExamAdmin(examData) {
  const { NOMBRE, DESCRIPCION } = examData;
  
  // Verificar que el nombre no esté repetido
  const [existingExam] = await pool.query('SELECT * FROM TIPO_EXAMEN WHERE NOMBRE = ?', [NOMBRE]);
  if (existingExam.length > 0) {
    throw new Error("Ya existe un examen con ese nombre");
  }
  
  const [result] = await pool.query(
    'INSERT INTO TIPO_EXAMEN (NOMBRE, DESCRIPCION) VALUES (?, ?)',
    [NOMBRE, DESCRIPCION]
  );
  
  const [newExam] = await pool.query('SELECT * FROM TIPO_EXAMEN WHERE ID = ?', [result.insertId]);
  return newExam[0];
}

// Actualizar un examen
export async function updateExamAdmin(examId, examData) {
  const { NOMBRE, DESCRIPCION } = examData;
  
  await pool.query(
    'UPDATE TIPO_EXAMEN SET NOMBRE = ?, DESCRIPCION = ? WHERE ID = ?',
    [NOMBRE, DESCRIPCION, examId]
  );
  
  const [updatedExam] = await pool.query('SELECT * FROM TIPO_EXAMEN WHERE ID = ?', [examId]);
  return updatedExam[0];
}

// Eliminar un examen
export async function deleteExamAdmin(examId) {
  // Verificar si hay usuarios asignados a este examen
  const [assignedUsers] = await pool.query('SELECT * FROM USUARIO_EXAMEN WHERE ID_TIPO_EXAMEN = ?', [examId]);
  if (assignedUsers.length > 0) {
    throw new Error("No se puede eliminar el examen porque hay usuarios asignados");
  }
  
  await pool.query('DELETE FROM TIPO_EXAMEN WHERE ID = ?', [examId]);
  return true;
}

// Asignar curso a usuario
export async function assignCourseToUser(userId, courseId, courseData) {
  const { CALIFICACION, ESTADO, FECHA_INICIO, FECHA_FIN } = courseData;
  
  // Verificar si ya existe la asignación
  const [existingAssignment] = await pool.query(
    'SELECT * FROM USUARIO_CURSO WHERE ID_USUARIO = ? AND ID_NIVEL_CURSO = ?',
    [userId, courseId]
  );
  
  if (existingAssignment.length > 0) {
    // Actualizar la asignación existente
    await pool.query(
      'UPDATE USUARIO_CURSO SET CALIFICACION = ?, ESTADO = ?, FECHA_INICIO = ?, FECHA_FIN = ? WHERE ID_USUARIO = ? AND ID_NIVEL_CURSO = ?',
      [CALIFICACION, ESTADO, FECHA_INICIO, FECHA_FIN, userId, courseId]
    );
  } else {
    // Crear nueva asignación
    await pool.query(
      'INSERT INTO USUARIO_CURSO (ID_USUARIO, ID_NIVEL_CURSO, CALIFICACION, ESTADO, FECHA_INICIO, FECHA_FIN) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, courseId, CALIFICACION, ESTADO, FECHA_INICIO, FECHA_FIN]
    );
  }
  
  return true;
}

// Asignar examen a usuario
export async function assignExamToUser(userId, examId, examData) {
  const { CALIFICACION, ESTADO, FECHA_PROGRAMADA } = examData;
  
  // Verificar si ya existe la asignación
  const [existingAssignment] = await pool.query(
    'SELECT * FROM USUARIO_EXAMEN WHERE ID_USUARIO = ? AND ID_TIPO_EXAMEN = ?',
    [userId, examId]
  );
  
  if (existingAssignment.length > 0) {
    // Actualizar la asignación existente
    await pool.query(
      'UPDATE USUARIO_EXAMEN SET CALIFICACION = ?, ESTADO = ?, FECHA_PROGRAMADA = ? WHERE ID_USUARIO = ? AND ID_TIPO_EXAMEN = ?',
      [CALIFICACION, ESTADO, FECHA_PROGRAMADA, userId, examId]
    );
  } else {
    // Crear nueva asignación
    await pool.query(
      'INSERT INTO USUARIO_EXAMEN (ID_USUARIO, ID_TIPO_EXAMEN, CALIFICACION, ESTADO, FECHA_PROGRAMADA) VALUES (?, ?, ?, ?, ?)',
      [userId, examId, CALIFICACION, ESTADO, FECHA_PROGRAMADA]
    );
  }
  
  return true;
}

// Obtener asignaciones de cursos de un usuario específico
export async function getUserCourses(userId) {
  const [rows] = await pool.query(`
    SELECT UC.ID, UC.ID_USUARIO, UC.ID_NIVEL_CURSO, UC.CALIFICACION, UC.ESTADO, 
           UC.FECHA_INICIO, UC.FECHA_FIN, NC.NOMBRE AS NOMBRE_CURSO, NC.DESCRIPCION
    FROM USUARIO_CURSO UC 
    JOIN NIVEL_CURSO NC ON UC.ID_NIVEL_CURSO = NC.ID 
    WHERE UC.ID_USUARIO = ?
  `, [userId]);
  
  return rows;
}

// Obtener asignaciones de exámenes de un usuario específico
export async function getUserExams(userId) {
  const [rows] = await pool.query(`
    SELECT UE.ID, UE.ID_USUARIO, UE.ID_TIPO_EXAMEN, UE.CALIFICACION, UE.ESTADO, 
           UE.FECHA_PROGRAMADA, TE.NOMBRE AS NOMBRE_EXAMEN, TE.DESCRIPCION
    FROM USUARIO_EXAMEN UE 
    JOIN TIPO_EXAMEN TE ON UE.ID_TIPO_EXAMEN = TE.ID 
    WHERE UE.ID_USUARIO = ?
  `, [userId]);
  
  return rows;
}

// Actualizar una asignación específica de curso para un usuario
export async function updateUserCourse(userCourseId, courseData) {
  const { CALIFICACION, ESTADO, FECHA_INICIO, FECHA_FIN } = courseData;
  
  await pool.query(`
    UPDATE USUARIO_CURSO 
    SET CALIFICACION = ?, ESTADO = ?, FECHA_INICIO = ?, FECHA_FIN = ? 
    WHERE ID = ?
  `, [CALIFICACION, ESTADO, FECHA_INICIO, FECHA_FIN, userCourseId]);
  
  // Obtener la asignación actualizada
  const [updatedRow] = await pool.query(`
    SELECT UC.*, NC.NOMBRE AS NOMBRE_CURSO 
    FROM USUARIO_CURSO UC 
    JOIN NIVEL_CURSO NC ON UC.ID_NIVEL_CURSO = NC.ID 
    WHERE UC.ID = ?
  `, [userCourseId]);
  
  return updatedRow[0];
}

// Actualizar una asignación específica de examen para un usuario
export async function updateUserExam(userExamId, examData) {
  const { CALIFICACION, ESTADO, FECHA_PROGRAMADA } = examData;
  
  await pool.query(`
    UPDATE USUARIO_EXAMEN 
    SET CALIFICACION = ?, ESTADO = ?, FECHA_PROGRAMADA = ? 
    WHERE ID = ?
  `, [CALIFICACION, ESTADO, FECHA_PROGRAMADA, userExamId]);
  
  // Obtener la asignación actualizada
  const [updatedRow] = await pool.query(`
    SELECT UE.*, TE.NOMBRE AS NOMBRE_EXAMEN 
    FROM USUARIO_EXAMEN UE 
    JOIN TIPO_EXAMEN TE ON UE.ID_TIPO_EXAMEN = TE.ID 
    WHERE UE.ID = ?
  `, [userExamId]);
  
  return updatedRow[0];
}

// Eliminar asignación de curso de un usuario
export async function deleteUserCourse(userCourseId) {
  await pool.query('DELETE FROM USUARIO_CURSO WHERE ID = ?', [userCourseId]);
  return true;
}

// Eliminar asignación de examen de un usuario
export async function deleteUserExam(userExamId) {
  await pool.query('DELETE FROM USUARIO_EXAMEN WHERE ID = ?', [userExamId]);
  return true;
}

// Obtener estadísticas para administrador
export async function getAdminStats() {
  // Obtener conteo de usuarios
  const [usersCount] = await pool.query('SELECT COUNT(*) as total FROM USUARIO');
  
  // Obtener conteo de usuarios activos (si existe el campo ACTIVO)
  const [activeUsersCount] = await pool.query("SELECT COUNT(*) as total FROM USUARIO WHERE ACTIVO = true");
  
  // Obtener conteo de cursos completados
  const [completedCoursesCount] = await pool.query("SELECT COUNT(*) as total FROM USUARIO_CURSO WHERE ESTADO = 'Completado'");
  
  // Obtener conteo de exámenes programados
  const [scheduledExamsCount] = await pool.query("SELECT COUNT(*) as total FROM USUARIO_EXAMEN WHERE ESTADO = 'Programado'");
  
  return {
    totalUsers: usersCount[0].total,
    activeUsers: activeUsersCount[0].total,
    completedCourses: completedCoursesCount[0].total,
    scheduledExams: scheduledExamsCount[0].total
  };
}

// Exportar pool para uso directo si es necesario
export { pool };