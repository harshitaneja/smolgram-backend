import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smolgramdb',
  waitForConnections: true,
  connectionLimit: 10,
});

export default pool;

// Initialize schema
export async function initDatabase() {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS experiments (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('DRAFT', 'ACTIVE', 'COMPLETED') DEFAULT 'DRAFT',
        startDate DATETIME,
        endDate DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS treatments (
        id VARCHAR(36) PRIMARY KEY,
        experimentId VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        demetricate BOOLEAN DEFAULT FALSE,
        config JSON,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (experimentId) REFERENCES experiments(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS participants (
        id VARCHAR(36) PRIMARY KEY,
        authcode VARCHAR(10) NOT NULL UNIQUE,
        experimentId VARCHAR(36) NOT NULL,
        treatmentId VARCHAR(36) NOT NULL,
        instagramHandle VARCHAR(255),
        instagramId VARCHAR(255),
        deviceType ENUM('ios', 'android'),
        status ENUM('NOT_STARTED', 'ACTIVE', 'COMPLETED') DEFAULT 'NOT_STARTED',
        startTime DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (experimentId) REFERENCES experiments(id) ON DELETE CASCADE,
        FOREIGN KEY (treatmentId) REFERENCES treatments(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS participant_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        participantId VARCHAR(36) NOT NULL,
        logType VARCHAR(100),
        data JSON,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (participantId) REFERENCES participants(id) ON DELETE CASCADE
      )
    `);

    console.log('✓ Database schema initialized');
  } finally {
    conn.release();
  }
}
