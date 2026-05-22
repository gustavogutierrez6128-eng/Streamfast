require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function importarBaseDeDatos() {
  console.log('⏳ Conectando a Aiven e iniciando migración...');
  
  const pool = mysql.createPool({
    host:             process.env.DB_HOST,
    user:             process.env.DB_USER,
    password:         process.env.DB_PASSWORD,
    database:         process.env.DB_NAME,
    port:             process.env.DB_PORT,
    ssl: { rejectUnauthorized: false },
    multipleStatements: true 
  });

  try {
    // Leemos tu archivo SQL
    const sqlPath = path.join(__dirname, 'Streamfast2.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Lo ejecutamos en la nube
    await pool.query(sql);
    console.log('🚀 ¡Todo listo! Tus tablas y datos se subieron con éxito a Aiven.');
  } catch (error) {
    console.error('❌ Hubo un error al importar:', error.message);
  } finally {
    await pool.end();
  }
}

importarBaseDeDatos();