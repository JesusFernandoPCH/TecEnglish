import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import {
    getUserByNoControl,
    getAdminByEmail,
    getUserProfile,
    getCurrentCourse,
    getAllCourses,
    getAllExamTypes,
    updateUserProfile,
    updateUserPassword,
    getPosts,
    // Funciones de administrador
    getAllUsers,
    createUserAdmin,
    updateUserAdmin,
    deleteUserAdmin,
    getAllCoursesAdmin,
    createCourseAdmin,
    updateCourseAdmin,
    deleteCourseAdmin,
    getAllExamsAdmin,
    createExamAdmin,
    updateExamAdmin,
    deleteExamAdmin,
    assignCourseToUser,
    assignExamToUser,
    getAdminStats,
    getUserCourses,
    getUserExams,
    updateUserCourse,
    updateUserExam,
    deleteUserCourse,
    deleteUserExam,
    getDocenteByEmail,
    getGruposDocente,
    getEstudiantesGrupo,
    updateCalificacionEstudiante,
    getCalificacionesGrupoParaExportar,
    getAllTeachers,
    createTeacher,
    updateTeacher,
    bulkAssignCourseToUsers,
    bulkRemoveCourseFromUsers,
    deleteTeacher,
    getDocenteCursoAssignments,
    createDocenteCursoAssignment,
    updateDocenteCursoAssignment,
    deleteDocenteCursoAssignment
} from "./database.js";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: '*', // En desarrollo permitimos cualquier origen
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }));
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    
    if (req.method === 'POST' || req.method === 'PUT') {
      console.log('Body:', req.body);
    }
    
    next();
  });

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "tecenglish_secret_key";

// Middleware para verificar el token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    
    if (!token) {
        return res.status(401).json({ error: "Token de autenticación requerido" });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Token inválido o expirado" });
        }
        console.log("Token decodificado:", user); // Para depuración
        req.user = user;
        next();
    });
};

// Middleware para verificar si es administrador
const isAdmin = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ error: "Acceso denegado. Se requieren permisos de administrador" });
    }
    next();
};

// Ruta para login de usuarios
app.post("/api/login", async (req, res) => {
    try {
        const { noControl, password, isAdmin } = req.body;
        
        if (isAdmin) {
            // Login para administrador
            const admin = await getAdminByEmail(noControl); // En este caso noControl se usa como email
            
            if (!admin || admin.PASSWORD !== password) {
                return res.status(401).json({ error: "Credenciales inválidas" });
            }
            
            const token = jwt.sign({ id: admin.ID, isAdmin: true }, JWT_SECRET, { expiresIn: "24h" });
            
            return res.json({
                token,
                user: {
                    id: admin.ID,
                    nombre: admin.NOMBRE,
                    email: admin.EMAIL,
                    isAdmin: true
                }
            });
        } else {
            // Login para usuario normal
            const user = await getUserByNoControl(noControl);
            
            if (!user || user.PASSWORD !== password) {
                return res.status(401).json({ error: "Credenciales inválidas" });
            }
            
            // En una aplicación real, verificarías el hash de la contraseña:
            // const isMatch = await bcrypt.compare(password, user.PASSWORD);
            
            const token = jwt.sign({ id: user.ID, isAdmin: false }, JWT_SECRET, { expiresIn: "24h" });
            
            // Actualizar último acceso
            // await updateLastAccess(user.ID);
            
            return res.json({
                token,
                user: {
                    id: user.ID,
                    nombre: user.NOMBRE,
                    apellido: user.APELLIDO,
                    noControl: user.NOCONTROL,
                    email: user.EMAIL,
                    isAdmin: false
                }
            });
        }
    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Ruta para login de docentes
app.post("/api/login-docente", async (req, res) => {
  try {
      const { email, password } = req.body;
      
      const docente = await getDocenteByEmail(email);
      
      if (!docente || docente.PASSWORD !== password) {
          return res.status(401).json({ error: "Credenciales inválidas" });
      }
      
      const token = jwt.sign({ 
          id: docente.ID, 
          isDocente: true 
      }, JWT_SECRET, { expiresIn: "24h" });
      
      return res.json({
          token,
          user: {
              id: docente.ID,
              nombre: docente.NOMBRE,
              apellido: docente.APELLIDO,
              email: docente.EMAIL,
              isDocente: true
          }
      });
  } catch (error) {
      console.error("Error en login de docente:", error);
      res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Middleware para verificar si es docente
const isDocente = (req, res, next) => {
  if (!req.user || !req.user.isDocente) {
    return res.status(403).json({ error: "Acceso denegado. Se requieren permisos de docente" });
  }
  next();
};

// Obtener grupos asignados al docente
app.get("/api/docente/grupos", authenticateToken, isDocente, async (req, res) => {
  try {
      const docenteId = req.user.id;
      const grupos = await getGruposDocente(docenteId);
      res.json(grupos);
  } catch (error) {
      console.error("Error al obtener grupos:", error);
      res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Obtener estudiantes de un grupo específico
app.get("/api/docente/grupos/:grupoId/estudiantes", authenticateToken, isDocente, async (req, res) => {
  try {
      const grupoId = req.params.grupoId;
      const estudiantes = await getEstudiantesGrupo(grupoId);
      res.json(estudiantes);
  } catch (error) {
      console.error("Error al obtener estudiantes del grupo:", error);
      res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Actualizar calificación de un estudiante
app.post("/api/docente/calificaciones", authenticateToken, isDocente, async (req, res) => {
  try {
      const calificacionId = await updateCalificacionEstudiante(req.body);
      res.json({ 
          success: true, 
          message: "Calificación actualizada correctamente",
          calificacionId
      });
  } catch (error) {
      console.error("Error al actualizar calificación:", error);
      res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Obtener calificaciones para exportar
app.get("/api/docente/grupos/:grupoId/exportar", authenticateToken, isDocente, async (req, res) => {
  try {
      const grupoId = req.params.grupoId;
      const calificaciones = await getCalificacionesGrupoParaExportar(grupoId);
      
      // Verificar si hay calificaciones completas
      const hayCalificaciones = calificaciones.some(cal => cal.CALIFICACION !== 'No evaluado');
      
      if (!hayCalificaciones) {
          return res.status(400).json({ 
              error: "No hay calificaciones registradas para este grupo", 
              calificaciones: [] 
          });
      }
      
      res.json(calificaciones);
  } catch (error) {
      console.error("Error al exportar calificaciones:", error);
      res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Obtener cursos de un usuario específico
app.get("/api/admin/users/:userId/courses", authenticateToken, isAdmin, async (req, res) => {
  try {
    const userId = req.params.userId;
    const courses = await getUserCourses(userId);
    res.json(courses);
  } catch (error) {
    console.error("Error al obtener cursos del usuario:", error);
    res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
});

// Obtener exámenes de un usuario específico
app.get("/api/admin/users/:userId/exams", authenticateToken, isAdmin, async (req, res) => {
  try {
    const userId = req.params.userId;
    const exams = await getUserExams(userId);
    res.json(exams);
  } catch (error) {
    console.error("Error al obtener exámenes del usuario:", error);
    res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
});

// Actualizar un curso específico de un usuario
app.put("/api/admin/user-courses/:userCourseId", authenticateToken, isAdmin, async (req, res) => {
  try {
    const userCourseId = req.params.userCourseId;
    const updatedCourse = await updateUserCourse(userCourseId, req.body);
    res.json(updatedCourse);
  } catch (error) {
    console.error("Error al actualizar curso del usuario:", error);
    res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
});

// Actualizar un examen específico de un usuario
app.put("/api/admin/user-exams/:userExamId", authenticateToken, isAdmin, async (req, res) => {
  try {
    const userExamId = req.params.userExamId;
    const updatedExam = await updateUserExam(userExamId, req.body);
    res.json(updatedExam);
  } catch (error) {
    console.error("Error al actualizar examen del usuario:", error);
    res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
});

// Eliminar un curso específico de un usuario
app.delete("/api/admin/user-courses/:userCourseId", authenticateToken, isAdmin, async (req, res) => {
  try {
    const userCourseId = req.params.userCourseId;
    await deleteUserCourse(userCourseId);
    res.json({ success: true, message: "Asignación de curso eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar curso del usuario:", error);
    res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
});

// Eliminar un examen específico de un usuario
app.delete("/api/admin/user-exams/:userExamId", authenticateToken, isAdmin, async (req, res) => {
  try {
    const userExamId = req.params.userExamId;
    await deleteUserExam(userExamId);
    res.json({ success: true, message: "Asignación de examen eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar examen del usuario:", error);
    res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
});

// Ruta para obtener perfil del usuario
app.get("/api/profile", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const profile = await getUserProfile(userId);
        
        if (!profile) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        
        const currentCourse = await getCurrentCourse(userId);
        
        res.json({
            user: {
                id: profile.user.ID,
                nombre: profile.user.NOMBRE,
                apellido: profile.user.APELLIDO,
                noControl: profile.user.NOCONTROL,
                email: profile.user.EMAIL
            },
            courses: profile.courses.map(course => ({
                id: course.ID,
                nombre: course.NOMBRE,
                calificacion: course.CALIFICACION,
                estado: course.ESTADO,
                fechaInicio: course.FECHA_INICIO,
                fechaFin: course.FECHA_FIN
            })),
            exams: profile.exams.map(exam => ({
                id: exam.ID,
                nombre: exam.NOMBRE,
                calificacion: exam.CALIFICACION,
                estado: exam.ESTADO,
                fechaProgramada: exam.FECHA_PROGRAMADA
            })),
            currentCourse: currentCourse ? {
                id: currentCourse.ID,
                nombre: currentCourse.NOMBRE,
                estado: currentCourse.ESTADO
            } : null
        });
    } catch (error) {
        console.error("Error al obtener perfil:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Ruta para actualizar perfil
app.put("/api/profile", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const updatedData = req.body;
        
        const updatedProfile = await updateUserProfile(userId, updatedData);
        
        res.json({
            success: true,
            profile: updatedProfile
        });
    } catch (error) {
        console.error("Error al actualizar perfil:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Ruta para cambiar contraseña
app.put("/api/change-password", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;
        
        // Verificar contraseña actual (en una aplicación real)
        // const user = await getUserById(userId);
        // const isMatch = await bcrypt.compare(currentPassword, user.PASSWORD);
        // if (!isMatch) return res.status(400).json({ error: "Contraseña actual incorrecta" });
        
        // En una aplicación real, hashearías la nueva contraseña:
        // const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        await updateUserPassword(userId, newPassword);
        
        res.json({ success: true, message: "Contraseña actualizada correctamente" });
    } catch (error) {
        console.error("Error al cambiar contraseña:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Ruta para obtener posts/anuncios
app.get("/api/posts", authenticateToken, async (req, res) => {
    try {
        const posts = await getPosts();
        res.json(posts);
    } catch (error) {
        console.error("Error al obtener posts:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// === RUTAS DE ADMINISTRADOR ===

// Obtener todos los usuarios
app.get("/api/admin/users", authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Crear un nuevo usuario
app.post("/api/admin/users", authenticateToken, isAdmin, async (req, res) => {
  try {
    req.body.ID_ADMINISTRADOR = req.user.id;
    const newUser = await createUserAdmin(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error al crear usuario:", error);
    res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
});

// Actualizar un usuario existente
app.put("/api/admin/users/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const updatedUser = await updateUserAdmin(userId, req.body);
    res.json(updatedUser);
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
});

// Eliminar un usuario
app.delete("/api/admin/users/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    await deleteUserAdmin(userId);
    res.json({ success: true, message: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
});

// Obtener todos los cursos
app.get("/api/admin/courses", authenticateToken, isAdmin, async (req, res) => {
  try {
    const courses = await getAllCoursesAdmin();
    res.json(courses);
  } catch (error) {
    console.error("Error al obtener cursos:", error);
    res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
});

// Crear un nuevo curso
app.post("/api/admin/courses", authenticateToken, isAdmin, async (req, res) => {
  try {
    const newCourse = await createCourseAdmin(req.body);
    res.status(201).json(newCourse);
  } catch (error) {
    console.error("Error al crear curso:", error);
    res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
});

// Actualizar un curso existente
app.put("/api/admin/courses/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const courseId = req.params.id;
    const updatedCourse = await updateCourseAdmin(courseId, req.body);
    res.json(updatedCourse);
  } catch (error) {
    console.error("Error al actualizar curso:", error);
    res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
});

// Eliminar un curso
app.delete("/api/admin/courses/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const courseId = req.params.id;
    await deleteCourseAdmin(courseId);
    res.json({ success: true, message: "Curso eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar curso:", error);
    res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
});

// Obtener todos los exámenes
app.get("/api/admin/exams", authenticateToken, isAdmin, async (req, res) => {
  try {
    const exams = await getAllExamsAdmin();
    res.json(exams);
  } catch (error) {
    console.error("Error al obtener exámenes:", error);
    res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
});

// Crear un nuevo examen
app.post("/api/admin/exams", authenticateToken, isAdmin, async (req, res) => {
  try {
    const newExam = await createExamAdmin(req.body);
    res.status(201).json(newExam);
  } catch (error) {
    console.error("Error al crear examen:", error);
    res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
});

// Actualizar un examen existente
app.put("/api/admin/exams/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const examId = req.params.id;
    const updatedExam = await updateExamAdmin(examId, req.body);
    res.json(updatedExam);
  } catch (error) {
    console.error("Error al actualizar examen:", error);
    res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
});

// Eliminar un examen
app.delete("/api/admin/exams/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const examId = req.params.id;
    await deleteExamAdmin(examId);
    res.json({ success: true, message: "Examen eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar examen:", error);
    res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
});

// Asignar curso a usuario
// Asignar curso a usuario
app.post("/api/admin/users/:userId/courses/:courseId", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { userId, courseId } = req.params;
    await assignCourseToUser(userId, courseId, req.body);
    res.json({ success: true, message: "Curso asignado correctamente" });
  } catch (error) {
    console.error("Error al asignar curso:", error);
    res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
});

// Asignar examen a usuario
app.post("/api/admin/users/:userId/exams/:examId", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { userId, examId } = req.params;
    await assignExamToUser(userId, examId, req.body);
    res.json({ success: true, message: "Examen asignado correctamente" });
  } catch (error) {
    console.error("Error al asignar examen:", error);
    res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
});

// Ruta para crear múltiples usuarios en bloque
app.post("/api/admin/users/bulk", authenticateToken, isAdmin, async (req, res) => {
  try {
    const usersData = req.body;
    
    if (!Array.isArray(usersData) || usersData.length === 0) {
      return res.status(400).json({ error: "Formato de datos inválido" });
    }
    
    // Añadir ID del administrador a cada registro
    const usersWithAdmin = usersData.map(user => ({
      ...user,
      ID_ADMINISTRADOR: req.user.id
    }));
    
    const results = await bulkCreateUsers(usersWithAdmin);
    res.status(200).json(results);
  } catch (error) {
    console.error("Error al crear usuarios en bloque:", error);
    res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
});

// Ruta para asignar cursos a múltiples usuarios en bloque
app.post("/api/admin/bulk-assign-course", authenticateToken, isAdmin, async (req, res) => {
  try {
    const results = await bulkAssignCourseToUsers(req.body);
    res.status(200).json(results);
  } catch (error) {
    console.error("Error en asignación masiva de cursos:", error);
    res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
});

// Ruta para eliminar cursos de múltiples usuarios en bloque
app.post("/api/admin/bulk-remove-course", authenticateToken, isAdmin, async (req, res) => {
  try {
    const results = await bulkRemoveCourseFromUsers(req.body);
    res.status(200).json(results);
  } catch (error) {
    console.error("Error en eliminación masiva de cursos:", error);
    res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
});

// Obtener todos los docentes
app.get("/api/admin/teachers", authenticateToken, isAdmin, async (req, res) => {
  try {
    const teachers = await getAllTeachers();
    res.json(teachers);
  } catch (error) {
    console.error("Error al obtener docentes:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Crear un nuevo docente
app.post("/api/admin/teachers", authenticateToken, isAdmin, async (req, res) => {
  try {
    const newTeacher = await createTeacher(req.body);
    res.status(201).json(newTeacher);
  } catch (error) {
    console.error("Error al crear docente:", error);
    res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
});

// Actualizar un docente existente
app.put("/api/admin/teachers/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const teacherId = req.params.id;
    const updatedTeacher = await updateTeacher(teacherId, req.body);
    res.json(updatedTeacher);
  } catch (error) {
    console.error("Error al actualizar docente:", error);
    res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
});

// Eliminar un docente
app.delete("/api/admin/teachers/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const teacherId = req.params.id;
    await deleteTeacher(teacherId);
    res.json({ success: true, message: "Docente eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar docente:", error);
    res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
});

// Obtener estadísticas para administradores
app.get("/api/admin/stats", authenticateToken, isAdmin, async (req, res) => {
  try {
    const stats = await getAdminStats();
    res.json(stats);
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
});

// Inicio del servidor
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor iniciado en puerto ${PORT}`);
    console.log(`Accesible en: http://localhost:${PORT}`);
    console.log(`Accesible desde otros dispositivos en: http://10.0.0.11:${PORT}`);
});

// Obtener todas las asignaciones docente-curso
app.get("/api/admin/docente-curso", authenticateToken, isAdmin, async (req, res) => {
  try {
    const assignments = await getDocenteCursoAssignments();
    res.json(assignments);
  } catch (error) {
    console.error("Error al obtener asignaciones docente-curso:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Crear una nueva asignación docente-curso
app.post("/api/admin/docente-curso", authenticateToken, isAdmin, async (req, res) => {
  try {
    const newAssignment = await createDocenteCursoAssignment(req.body);
    res.status(201).json(newAssignment);
  } catch (error) {
    console.error("Error al crear asignación docente-curso:", error);
    res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
});

// Actualizar una asignación docente-curso existente
app.put("/api/admin/docente-curso/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const updatedAssignment = await updateDocenteCursoAssignment(assignmentId, req.body);
    res.json(updatedAssignment);
  } catch (error) {
    console.error("Error al actualizar asignación docente-curso:", error);
    res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
});

// Eliminar una asignación docente-curso
app.delete("/api/admin/docente-curso/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const assignmentId = req.params.id;
    await deleteDocenteCursoAssignment(assignmentId);
    res.json({ success: true, message: "Asignación docente-curso eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar asignación docente-curso:", error);
    res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
});