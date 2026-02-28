const pool = require("../db");

exports.getConnection = async () => {
  return await pool.getConnection();
};

exports.fetchContactsByEmailOrPhone = async (conn, email, phoneNumber) => {
  const [rows] = await conn.query(
    `SELECT * FROM Contact WHERE email = ? OR phoneNumber = ?`,
    [email || null, phoneNumber || null]
  );
  return rows;
};

exports.fetchGroupByPrimaryId = async (conn, primaryId) => {
  const [rows] = await conn.query(
    `SELECT * FROM Contact WHERE id = ? OR linkedId = ?`,
    [primaryId, primaryId]
  );
  return rows;
};

exports.createPrimaryContact = async (conn, email, phoneNumber) => {
  const [result] = await conn.query(
    `INSERT INTO Contact (email, phoneNumber, linkPrecedence)
     VALUES (?, ?, 'primary')`,
    [email || null, phoneNumber || null]
  );
  return result.insertId;
};

exports.createSecondaryContact = async (conn, email, phoneNumber, primaryId) => {
  await conn.query(
    `INSERT INTO Contact (email, phoneNumber, linkedId, linkPrecedence)
     VALUES (?, ?, ?, 'secondary')`,
    [email || null, phoneNumber || null, primaryId]
  );
};

exports.convertToSecondary = async (conn, contactId, primaryId) => {
  await conn.query(
    `UPDATE Contact
     SET linkedId = ?, linkPrecedence = 'secondary'
     WHERE id = ?`,
    [primaryId, contactId]
  );
};
