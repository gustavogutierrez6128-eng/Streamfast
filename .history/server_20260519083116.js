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
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ ok: false, message: 'Token inválido' }); }
}

app.post('/api/register', async (req, res) => {
  const { nombre, correo, password } = req.body;
  if (!nombre || !correo || !password)
    return res.status(400).json({ ok: false, message: 'Faltan campos requeridos' });
  if (password.length < 8)
    return res.status(400).json({ ok: false, message: 'La contraseña debe tener mínimo 8 caracteres' });
  try {
    const [existing] = await pool.query('SELECT usuarioid FROM usuarios WHERE correo = ?', [correo]);
    if (existing.length > 0)
      return res.status(409).json({ ok: false, message: 'Este correo ya está registrado' });
    const hash = await bcrypt.hash(password, 10);
    const hoy  = new Date().toISOString().split('T')[0];
    const [result] = await pool.query(
      `INSERT INTO usuarios (correo, password_hash, nombre, plan, fecha_registro) VALUES (?,?,?,'basico',?)`,
      [correo, hash, nombre, hoy]
    );
    res.json({ ok: true, usuarioid: result.insertId });
  } catch (err) {
    console.error('Error registro:', err);
    res.status(500).json({ ok: false, message: 'Error interno del servidor' });
  }
});

app.post('/api/select-plan', async (req, res) => {
  const { correo, plan } = req.body;
  if (!['basico','estandar','premium'].includes(plan))
    return res.status(400).json({ ok: false, message: 'Plan no válido' });
  try {
    await pool.query('UPDATE usuarios SET plan = ? WHERE correo = ?', [plan, correo]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al guardar el plan' });
  }
});

app.post('/api/login', async (req, res) => {
  const { correo, password } = req.body;
  if (!correo || !password)
    return res.status(400).json({ ok: false, message: 'Ingresa tu correo y contraseña' });
  try {
    const [rows] = await pool.query(
      `SELECT usuarioid, nombre, correo, password_hash, plan FROM usuarios WHERE correo = ?`, [correo]
    );
    if (!rows.length)
      return res.status(401).json({ ok: false, message: 'Correo o contraseña incorrectos' });
    const u = rows[0];
    if (!u.password_hash)
      return res.status(401).json({ ok: false, message: 'Esta cuenta no tiene contraseña. Regístrate primero.' });
    const valido = await bcrypt.compare(password, u.password_hash);
    if (!valido)
      return res.status(401).json({ ok: false, message: 'Correo o contraseña incorrectos' });
    const token = jwt.sign({ id: u.usuarioid, correo: u.correo, nombre: u.nombre }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ ok: true, token, usuario: { id: u.usuarioid, nombre: u.nombre, correo: u.correo, plan: u.plan } });
  } catch (err) {
    console.error('Error login:', err);
    res.status(500).json({ ok: false, message: 'Error interno del servidor' });
  }
});

app.get('/api/peliculas', async (req, res) => {
  try {
    const genreEmojis = {
      'Fantasía': '🔮', 'Drama': '🎭', 'Crimen': '🕵️‍♂️', 
      'Ciencia ficción': '🚀', 'Miniserie': '📺', 
      'Comedia oscura': '🖤', 'Comedia': '🍿', 'Acción': '💥', 'Terror': '👻', 'Animación': '✨'
    };

    const [rows] = await pool.query(`
      SELECT 
        s.serie_id AS id, 
        s.titulo, 
        s.descripcion, 
        s.año_lanzamiento AS anio, 
        s.genero,
        COALESCE(ROUND(AVG(e.rating_imdb), 1), 8.5) AS calificacion
      FROM Series s
      LEFT JOIN Episodios e ON s.serie_id = e.serie_id
      GROUP BY s.serie_id
      ORDER BY s.genero, s.titulo
    `);

    const peliculas = rows.map(row => ({
      ...row,
      emoji: genreEmojis[row.genero] || '🎬'
    }));

    res.json({ ok: true, peliculas });
  } catch (err) {
    console.error('Error al cargar catálogo de MySQL:', err);
    res.status(500).json({ ok: false, message: 'Error interno al cargar el catálogo' });
  }
});

app.get('/api/series', authMiddleware, async (req, res) => {
  try {
    const [series] = await pool.query(`
      SELECT s.serie_id, s.titulo, s.descripcion, s.año_lanzamiento, s.genero,
             GROUP_CONCAT(a.nombre ORDER BY a.nombre SEPARATOR ', ') AS actores
      FROM Series s
      LEFT JOIN Actuaciones ac ON s.serie_id = ac.serie_id
      LEFT JOIN Actores a      ON ac.actor_id = a.actor_id
      GROUP BY s.serie_id
      ORDER BY s.genero, s.titulo
    `);
    res.json({ ok: true, series });
  } catch (err) {
    console.error('Error catálogo:', err);
    res.status(500).json({ ok: false, message: 'Error al cargar el catálogo' });
  }
});


app.get('/api/series/:id', authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const [[serie]] = await pool.query('SELECT * FROM Series WHERE serie_id = ?', [id]);
    if (!serie) return res.status(404).json({ ok: false, message: 'Serie no encontrada' });

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
      WHERE s.titulo LIKE ? OR s.genero LIKE ? OR s.descripcion LIKE ?
      GROUP BY s.serie_id
    `, [q, q, q]);
    res.json({ ok: true, series });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error en la búsqueda' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 StreamFast en http://localhost:${PORT}`));