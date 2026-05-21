require('dotenv').config();
const express = require('express');
const mysql   = require('mysql2/promise');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const cors    = require('cors');
const path    = require('path');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

const pool = mysql.createPool({
  host:     process.env.DB_HOST || 'localhost',
  user:     process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'Streamfast',
  waitForConnections: true,
  connectionLimit: 10,
});

const JWT_SECRET = process.env.JWT_SECRET || 'streamfast_secret_cambiar_en_produccion';

function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ ok: false, message: 'Sin token' });
  const token = header.split(' ')[1];
  try { 
    req.user = jwt.verify(token, JWT_SECRET); 
    next(); 
  } catch { 
    res.status(401).json({ ok: false, message: 'Token inválido' }); 
  }
}

async function registrarUsuario(req, res) {
  const { nombre, correo, email, password } = req.body;
  const emailFinal = correo || email;

  if (!nombre || !emailFinal || !password) {
    return res.status(400).json({ ok: false, error: 'Faltan campos requeridos', message: 'Faltan campos requeridos' });
  }
  try {
    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)',
      [nombre, emailFinal, passwordHash]
    );
    
    res.json({ ok: true, mensaje: '¡Usuario registrado con éxito!', message: 'Usuario registrado con éxito' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'El correo ya está registrado o hubo un error.', message: 'El correo ya está registrado o hubo un error interno' });
  }
}

app.post('/api/register', registrarUsuario);
app.post('/api/registro', registrarUsuario);

app.post('/api/login', async (req, res) => {
  const { correo, email, password } = req.body;
  const emailFinal = correo || email;

  if (!emailFinal || !password) {
    return res.status(400).json({ ok: false, message: 'Faltan campos requeridos' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [emailFinal]);
    if (rows.length === 0) {
      return res.status(401).json({ ok: false, error: 'Correo o contraseña incorrectos.', message: 'Credenciales incorrectas' });
    }

    const user = rows[0];

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ ok: false, error: 'Correo o contraseña incorrectos.', message: 'Credenciales incorrectas' });
    }

    const token = jwt.sign({ id: user.id, nombre: user.nombre }, JWT_SECRET, { expiresIn: '2h' });
    
    res.json({ 
      ok: true, 
      mensaje: 'Inicio de sesión correcto',
      token, 
      user: { nombre: user.nombre, email: user.email, correo: user.email },
      usuario: user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Error en el servidor.', message: 'Error en el servidor' });
  }
});

app.get('/api/series', async (req, res) => {
  try {
    const [series] = await pool.query('SELECT * FROM Series');
    res.json(series);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener las series de la base de datos' });
  }
});

app.get('/api/series/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [series] = await pool.query('SELECT * FROM Series WHERE serie_id = ?', [id]);
    if (series.length === 0) return res.status(404).json({ ok: false, message: 'Serie no encontrada' });

    const serie = series[0];

    const [episodios] = await pool.query(`
      SELECT e.*, d.nombre AS director
      FROM Episodios e
      LEFT JOIN Directores d ON e.director_id = d.director_id
      WHERE e.serie_id = ?
      ORDER BY e.temporada, e.episodio_id
    `, [id]);

    const [actores] = await pool.query(`
      SELECT a.nombre, ac.personaje
      FROM Actuaciones ac
      JOIN Actores a ON ac.actor_id = a.actor_id
      WHERE ac.serie_id = ?
    `, [id]);

    res.json({ ok: true, serie, episodios, actores });
  } catch (err) {
    console.error('Error detalle:', err);
    res.status(500).json({ ok: false, message: 'Error al cargar la serie' });
  }
});

app.get('/api/buscar', authMiddleware, async (req, res) => {
  const q = `%${req.query.q || ''}%`;
  try {
    const [series] = await pool.query(`
      SELECT s.serie_id, s.titulo, s.descripcion, s.año_lanzamiento, s.genero,
             GROUP_CONCAT(a.nombre SEPARATOR ', ') AS actores
      FROM Series s
      LEFT JOIN Actuaciones ac ON s.serie_id = ac.serie_id
      LEFT JOIN Actores a      ON ac.actor_id = a.actor_id
      WHERE s.titulo LIKE ? OR s.genero LIKE ?
      GROUP BY s.serie_id
    `, [q, q]);
    res.json({ ok: true, series });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error en la búsqueda' });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Servidor StreamFast corriendo en http://localhost:${PORT}`);
  console.log(`📂 Asegúrate de poner index.html dentro de /public`);
  console.log(`====================================================`);
});