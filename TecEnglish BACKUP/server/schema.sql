-- Creación de la base de datos con nombre corregido
CREATE DATABASE TECENGLISH;
USE TECENGLISH;

-- Tabla de administradores
CREATE TABLE ADMINISTRADOR (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    NOMBRE VARCHAR(50) NOT NULL,
    PASSWORD VARCHAR(50) NOT NULL,
    EMAIL VARCHAR(100) UNIQUE,
    FECHA_CREACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de usuarios
CREATE TABLE USUARIO (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    NOMBRE VARCHAR(50) NOT NULL,
    APELLIDO VARCHAR(50),
    PASSWORD VARCHAR(50) NOT NULL,
    NOCONTROL VARCHAR(50) NOT NULL UNIQUE,
    EMAIL VARCHAR(100) UNIQUE,
    FECHA_REGISTRO TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ULTIMO_ACCESO TIMESTAMP,
    ACTIVO BOOLEAN DEFAULT TRUE,
    ID_ADMINISTRADOR INT,
    FOREIGN KEY (ID_ADMINISTRADOR) REFERENCES ADMINISTRADOR(ID)
);

-- Tabla de niveles de cursos disponibles
CREATE TABLE NIVEL_CURSO (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    NOMBRE VARCHAR(50) NOT NULL UNIQUE,
    DESCRIPCION VARCHAR(255)
);

-- Tabla que registra los cursos que ha tomado cada usuario
CREATE TABLE USUARIO_CURSO (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    ID_USUARIO INT NOT NULL,
    ID_NIVEL_CURSO INT NOT NULL,
    CALIFICACION INT(3),
    ESTADO ENUM('Pendiente', 'En curso', 'Completado') DEFAULT 'Pendiente',
    FECHA_INICIO DATE,
    FECHA_FIN DATE,
    FOREIGN KEY (ID_USUARIO) REFERENCES USUARIO(ID),
    FOREIGN KEY (ID_NIVEL_CURSO) REFERENCES NIVEL_CURSO(ID)
);

-- Tabla de tipos de exámenes disponibles
CREATE TABLE TIPO_EXAMEN (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    NOMBRE VARCHAR(50) NOT NULL UNIQUE,
    DESCRIPCION VARCHAR(255)
);

-- Tabla que registra los exámenes de cada usuario
CREATE TABLE USUARIO_EXAMEN (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    ID_USUARIO INT NOT NULL,
    ID_TIPO_EXAMEN INT NOT NULL,
    CALIFICACION INT(3),
    ESTADO ENUM('Pendiente', 'Programado', 'Completado') DEFAULT 'Pendiente',
    FECHA_PROGRAMADA DATE,
    FOREIGN KEY (ID_USUARIO) REFERENCES USUARIO(ID),
    FOREIGN KEY (ID_TIPO_EXAMEN) REFERENCES TIPO_EXAMEN(ID)
);

-- Inserts de datos iniciales
INSERT INTO ADMINISTRADOR (NOMBRE, PASSWORD, EMAIL) VALUES ('admin', 'admin1', 'admin@tecenglish.edu.mx');

-- Insertar usuarios
INSERT INTO USUARIO (NOMBRE, APELLIDO, PASSWORD, NOCONTROL, EMAIL, ID_ADMINISTRADOR) 
VALUES ('Luis', 'García', 'user1', '21680142', 'luis@estudiante.edu.mx', 1);
INSERT INTO USUARIO (NOMBRE, APELLIDO, PASSWORD, NOCONTROL, EMAIL, ID_ADMINISTRADOR) 
VALUES ('Pao', 'López', 'user2', '21680149', 'pao@estudiante.edu.mx', 1);

-- Insertar niveles de cursos
INSERT INTO NIVEL_CURSO (NOMBRE, DESCRIPCION) 
VALUES 
('Inglés Básico A1', 'Curso introductorio de inglés'),
('Inglés Básico A2', 'Curso básico nivel 2'),
('Inglés Intermedio B1', 'Curso intermedio nivel 1'),
('Inglés Intermedio B2', 'Curso intermedio nivel 2'),
('Inglés Avanzado C1', 'Curso avanzado');

-- Insertar tipos de exámenes
INSERT INTO TIPO_EXAMEN (NOMBRE, DESCRIPCION) 
VALUES 
('Examen de Colocación', 'Examen para determinar el nivel inicial'),
('Examen 4 Habilidades', 'Evaluación de lectura, escritura, habla y escucha'),
('Examen TOEFL', 'Test Of English as a Foreign Language');

-- Insertar registros de cursos para usuarios
INSERT INTO USUARIO_CURSO (ID_USUARIO, ID_NIVEL_CURSO, CALIFICACION, ESTADO, FECHA_INICIO, FECHA_FIN) 
VALUES 
(1, 1, 98, 'Completado', '2024-01-15', '2024-02-20'),
(1, 2, 95, 'Completado', '2024-02-21', '2024-03-25'),
(1, 3, 90, 'Completado', '2024-03-26', '2024-04-30'),
(1, 4, NULL, 'En curso', '2024-05-01', NULL),
(1, 5, NULL, 'Pendiente', NULL, NULL);

-- Insertar registros de exámenes para usuarios
INSERT INTO USUARIO_EXAMEN (ID_USUARIO, ID_TIPO_EXAMEN, CALIFICACION, ESTADO, FECHA_PROGRAMADA) 
VALUES 
(1, 1, 85, 'Completado', '2024-01-10'),
(1, 2, NULL, 'Pendiente', NULL),
(1, 3, NULL, 'Programado', '2025-05-24');