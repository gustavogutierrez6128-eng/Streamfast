DROP DATABASE IF EXISTS Streamfast;
CREATE DATABASE Streamfast CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE Streamfast;

-- ── TABLA USUARIOS ───────────────────────
CREATE TABLE Streamfast.usuarios (
    usuarioid      INT AUTO_INCREMENT PRIMARY KEY,
    correo          VARCHAR(100),
    password_hash  VARCHAR(255) DEFAULT NULL,
    plan           ENUM('basico','estandar','premium') DEFAULT 'basico',
    nombre         VARCHAR(100),
    fecha_registro DATE
);

INSERT INTO Streamfast.usuarios (correo, nombre, fecha_registro) VALUES
('@soyunmaricon', 'Daniel', '2026-03-17'),
('@makunga',      'caguamon','2026-03-17'),
('@sircoño',      'miguel', '2026-03-17'),
('@mhm',          'marco',  '2026-03-17'),
('@maleficio',    'angel',  '2026-03-17');

-- ── TABLA SERIES ─────────────────────────
CREATE TABLE Streamfast.Series (
    serie_id        INT AUTO_INCREMENT PRIMARY KEY,
    titulo          VARCHAR(255) NOT NULL UNIQUE,
    descripcion      TEXT,
    año_lanzamiento INT,
    genero          VARCHAR(255)
);

-- ── TABLA DIRECTORES ─────────────────────
CREATE TABLE Streamfast.Directores (
    director_id  INT AUTO_INCREMENT PRIMARY KEY,
    nombre       VARCHAR(255) NOT NULL,
    nacionalidad VARCHAR(100)
);

-- ── TABLA ACTORES ────────────────────────
CREATE TABLE Streamfast.Actores (
    actor_id        INT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(255) NOT NULL,
    fecha_nacimiento DATE
);

-- ── TABLA EPISODIOS ──────────────────────
CREATE TABLE Streamfast.Episodios (
    episodio_id  INT AUTO_INCREMENT PRIMARY KEY,
    serie_id     INT,
    director_id  INT NULL,
    titulo       VARCHAR(255) NOT NULL,
    duracion     INT,
    rating_imdb  DECIMAL(3,1),
    temporada    INT,
    descripcion  TEXT,
    fecha_estreno DATE,
    FOREIGN KEY (serie_id)    REFERENCES Streamfast.Series(serie_id)       ON DELETE CASCADE,
    FOREIGN KEY (director_id) REFERENCES Streamfast.Directores(director_id) ON DELETE SET NULL
);

-- ── TABLA ACTUACIONES ────────────────────
CREATE TABLE Streamfast.Actuaciones (
    actor_id  INT,
    serie_id  INT,
    personaje VARCHAR(255),
    PRIMARY KEY (actor_id, serie_id),
    FOREIGN KEY (actor_id) REFERENCES Streamfast.Actores(actor_id)  ON DELETE CASCADE,
    FOREIGN KEY (serie_id) REFERENCES Streamfast.Series(serie_id)   ON DELETE CASCADE
);

-- ── INSERTS RESTANTES ────────────────────
INSERT INTO Streamfast.Directores (nombre, nacionalidad) VALUES
('Tim Van Patten',    'Estadounidense'),
('Mark Mylod',        'Británico'),
('Craig Mazin',       'Estadounidense'),
('Alan Taylor',       'Estadounidense'),
('David Nutter',      'Estadounidense'),
('Johan Renck',       'Sueco'),
('Cary Joji Fukunaga','Estadounidense'),
('Mike White',        'Estadounidense'),
('Sam Levinson',      'Estadounidense');

INSERT INTO Streamfast.Series (titulo, descripcion, año_lanzamiento, genero) VALUES
('Game of Thrones',       'Nobles familias luchan por el control del Trono de Hierro.',                      2011, 'Fantasía'),
('The Sopranos',          'Un jefe de la mafia de Nueva Jersey busca ayuda psiquiátrica.',                   1999, 'Drama'),
('The Wire',              'La escena de las drogas en Baltimore vista desde los ojos de la ley.',            2002, 'Crimen'),
('Succession',            'La familia Roy controla el conglomerado de medios más grande del mundo.',         2018, 'Drama'),
('The Last of Us',        'Un contrabandista escolta a una adolescente en un mundo post-apocalíptico.',      2023, 'Ciencia ficción'),
('Chernobyl',             'Dramatización del desastre nuclear de 1986.',                                     2019, 'Miniserie'),
('True Detective',        'Antología de investigaciones policiales.',                                        2014, 'Crimen'),
('The White Lotus',       'Vacaciones de lujo con giros oscuros.',                                           2021, 'Comedia oscura'),
('Euphoria',              'Estudiantes enfrentan drogas e identidad.',                                       2019, 'Drama'),
('House of the Dragon',   'Historia de los Targaryen.',                                                      2022, 'Fantasía'),
('Barry',                 'Un asesor o asesino se mete a actuar.',                                           2018, 'Comedia negra'),
('Curb Your Enthusiasm',  'Versión exagerada de Larry David.',                                               2000, 'Comedia'),
('Westworld',             'Parque futurista con androides.',                                                 2016, 'Ciencia ficción'),
('Band of Brothers',      'Segunda Guerra Mundial.',                                                         2001, 'Miniserie'),
('Silicon Valley',        'Programadores en Silicon Valley.',                                                2014, 'Comedia');

INSERT INTO Streamfast.Actores (nombre, fecha_nacimiento) VALUES
('Peter Dinklage',     '1969-06-11'),
('Emilia Clarke',      '1986-10-23'),
('James Gandolfini',   '1961-09-18'),
('Brian Cox',          '1946-06-01'),
('Pedro Pascal',       '1975-04-02'),
('Bella Ramsey',       '2003-09-30'),
('Dominic West',       '1969-10-15'),
('Idris Elba',         '1972-09-06'),
('Jeremy Strong',      '1978-12-25'),
('Jared Harris',       '1961-08-24'),
('Stellan Skarsgard',  '1951-06-13'),
('Matthew McConaughey','1969-11-04'),
('Woody Harrelson',    '1961-07-23'),
('Jennifer Coolidge',  '1961-08-28'),
('Murray Bartlett',    '1971-03-20'),
('Zendaya',            '1996-09-01'),
('Hunter Schafer',     '1998-12-31'),
('Paddy Considine',    '1973-09-05'),
('Matt Smith',         '1982-10-28'),
('Bill Hader',         '1978-06-07'),
('Larry David',        '1947-07-02'),
('Evan Rachel Wood',   '1987-09-07'),
('Anthony Hopkins',    '1937-12-31'),
('Damian Lewis',       '1971-02-11'),
('Thomas Middleditch', '1982-03-10');

INSERT INTO Streamfast.Actuaciones (actor_id, serie_id, personaje) VALUES
(1,  1,  'Tyrion Lannister'),
(2,  1,  'Daenerys Targaryen'),
(3,  2,  'Tony Soprano'),
(4,  4,  'Logan Roy'),
(9,  4,  'Kendall Roy'),
(5,  5,  'Joel Miller'),
(6,  5,  'Ellie Williams'),
(7,  3,  'Jimmy McNulty'),
(8,  3,  'Stringer Bell'),
(10, 6,  'Valery Legasov'),
(11, 6,  'Boris Shcherbina'),
(12, 7,  'Rust Cohle'),
(13, 7,  'Marty Hart'),
(14, 8,  'Tanya McQuoid'),
(15, 8,  'Armond'),
(16, 9,  'Rue Bennett'),
(17, 9,  'Jules Vaughn'),
(18, 10, 'Viserys Targaryen'),
(19, 10, 'Daemon Targaryen'),
(20, 11, 'Barry Berkman'),
(21, 12, 'Larry David'),
(22, 13, 'Dolores'),
(23, 13, 'Dr. Ford'),
(24, 14, 'Dick Winters'),
(25, 15, 'Richard Hendricks');

INSERT INTO Streamfast.Episodios (serie_id, director_id, titulo, duracion, rating_imdb, temporada, descripcion, fecha_estreno) VALUES
(1, 1, 'Winter is Coming',          62, 9.0, 1, 'Ned Stark descubre una conspiración.', '2011-04-17'),
(1, 4, 'The Rains of Castamere',     52, 9.9, 3, 'La Boda Roja.',                        '2013-06-02'),
(1, 5, 'Battle of the Bastards',     60, 9.9, 6, 'Jon Snow vs Ramsay Bolton.',           '2016-06-19'),
(5, 3, 'When You\'re Lost in the Darkness', 81, 8.8, 1, 'Inicio del viaje de Joel y Ellie.', '2023-01-15'),
(6, 6, 'Please Remain Calm',        62, 9.7, 1, 'El reactor número 4 explota.',         '2019-05-06'),
(4, 2, 'Succession - Pilot',        55, 8.3, 1, 'Logan Roy sufre un derrame.',          '2018-06-03'),
(7, 7, 'The Long Bright Dark',      55, 8.9, 1, 'Dos detectives investigan un ritual.', '2014-01-12'),
(9, 9, 'Pilot - Euphoria',          58, 8.3, 1, 'Rue sale de rehabilitación.',          '2019-06-16');