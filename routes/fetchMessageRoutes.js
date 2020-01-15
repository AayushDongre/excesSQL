const express = require('express');

const db = require('../dbConnection');

const router = express.Router();

/**
     * Fetch all messages
     * type: GET
     * query params = []
     * URL: /message/fetch/all
     */
router.get('/message/fetch/all', async (req, res) => {
  const conn = await db();
  try {
    await conn.query('START TRANSACTION');
    const result = await conn.query('select * from `recieved`');
    res.status(200).json({
      result,
    });
  } catch (err) {
    res.status(500).json({
      error: err,
    });
  } finally {
    await conn.release();
    await conn.destroy();
  }
});


/**
     * Fetch all message history
     * type: GET
     * query params = []
     * URL: /message/history/:sdrn
     */
router.get('/message/history/:sdrn', async (req, res) => {
  const conn = await db();
  try {
    await conn.query('START TRANSACTION');
    const result = await conn.query('select * from `recieved` where `by` = ?', [req.params.sdrn]);
    res.status(200).json({
      result,
    });
  } catch (err) {
    res.status(500).json({
      error: err,
    });
  } finally {
    await conn.release();
    await conn.destroy();
  }
});

/**
     * Fetch all messages for respective `identification`
     * type: GET
     * query params = []
     * URL: /message/fetch/:identification/all
     */
router.get('/message/fetch/:identification/all', async (req, res) => {
  const conn = await db();
  try {
    await conn.query('START TRANSACTION');
    const result = await conn.query(
      'select * from `recieved` where  `identification`= ?', [req.params.identification],
    );

    res.status(200).json({
      result,
    });
  } catch (err) {
    res.status(500).json({
      error: err,
    });
  } finally {
    await conn.release();
    await conn.destroy();
  }
});


/**
     * Fetch all messages for respective role(student or faculty) `id`
     * type: GET
     * query params = []
     * URL: /message/fetch/:(student or faculty)/:(roll or sdrn)/all
     */
router.get('/message/fetch/:role/:id/all', async (req, res) => {
  const conn = await db();
  try {
    let who = '';
    if (req.params.role === 'student') who = 'AS';
    else if (req.params.role === 'faculty') who = 'AF';

    await conn.query('START TRANSACTION');
    const resp = await conn.query(
      'select `topics` from `users` where  `id` =  ? ', [req.params.id],
    );
    const topics = resp[0].topics.split('_');
    let val = '';
    let query = '';
    query = `select * from \`recieved\` where ( identification in ('${who}',`;
    for (let i = 0; i < topics.length; i += 1) {
      if (i === 0) val += `${topics[i]}`;
      else val += `_${topics[i]}`;

      if (i === topics.length - 1) query += `'${val}'))`;
      else query += `'${val}',`;
    }
    query += ` or (\`to\` like '${req.params.id}') ORDER by timestamp DESC`;
    if (req.params.role === 'HOD' || req.params.role === 'principal' || req.params.role === 'admin') query = 'select * from `recieved` ORDER by timestamp DESC';

    const result = await conn.query(query);
    res.status(200).json({
      result,
    });
  } catch (err) {
    res.status(500).json({
      error: err,
    });
  } finally {
    await conn.release();
    await conn.destroy();
  }
});

module.exports = router;
