const express = require('express');

const db = require('../dbConnection');
const NotificationSender = require('./notificationSender');

const Sender = new NotificationSender();
const router = express.Router();


/**
 * create new user
 * type: POST
 * query params = {
 * id: 'sdrn or roll no',
 * role: 'student || faculty || HOD || Principal,
 * password: 'password',
 * topics:'topics to subscribe to ${department}_${student/faculty}_${year}...',
 * token: 'FCM registration token of the last device the user logged in from,
 *  }
 *
 * URL: /createUser
 */
router.post('/createUser', async (req, res) => {
  const conn = await db();
  try {
    const name = req.body.name !== null ? req.body.name : '';
    Sender.subscriber(req.body.token, req.body.topics);
    await conn.query('START TRANSACTION');
    const result = await conn.query('insert into `users` (`id`, `name`,`role`, `email`,`password`, `topics`, `token`) VALUES (?, ?, ?, ?, ?, ?)',
      [
        req.body.id,
        name,
        req.body.role,
        req.body.email,
        req.body.password,
        req.body.topics,
        req.body.token,
      ]);
    await conn.query('COMMIT');

    res.status(200).json({
      result,
    });
  } catch (err) {
    res.status(500).send(err);
  } finally {
    await conn.release();
    await conn.destroy();
  }
});
/**
   * Update existing user token
   * to be called whenever user logs out or logs in from new device or token is refreshed
   * type: POST
   * query params = {
   * id: 'sdrn or roll no',
   * newtoken: 'FCM registration token of the last device the user logged in from,
   *  }
   *
   * URL: /updateToken
   */
router.post('/updateToken', async (req, res) => {
  const conn = await db();
  try {
    Sender.subscriber(req.body.newtoken, req.body.topics);
    await conn.query('START TRANSACTION');
    const old = await conn.query(`select * from \`users\` where \`id\` = '${req.body.id}'`);
    const oldToken = old[0].token;
    Sender.logOut(oldToken);

    const result = await conn.query(`update \`users\` set \`token\` = '${req.body.newtoken}' where \`id\` = '${req.body.id}' `);
    await conn.query('COMMIT');

    res.status(200).send(result);
  } catch (err) {
    res.status(500).send(err);
  } finally {
    await conn.release();
    await conn.destroy();
  }
});

router.get('/login/:id/:password', async (req, res) => {
  const conn = await db();
  try {
    await conn.query('START TRANSACTION');
    const result = await conn.query('select * from `users` where `id` = ?', [req.params.id]);
    if (result[0].password === req.params.password) {
      res.status(200).send(result[0]);
    } else {
      res.status(500).send({
        error: 'Invalid Password',
      });
    }
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
   * Returns an array of faculty details
   * [[Sdrn1, Name1], [Sdrn2, Name2],  ]
   * type: GET
   *
   * URL: /fetchFacultyList
   */

router.get('/fetchFacultyList', async (req, res) => {
  const conn = await db();
  try {
    await conn.query('START TRANSACTION');
    const result = await conn.query('select `id`, `name` from `users` where `role` in ("faculty", "HOD", "principal")');
    const resp = [];
    for (let i = 0; i < result.length; i += 1) {
      resp.push({ sdrn: result[i].Sdrn, name: `${result[i].name}` });
    }
    res.status(200).send(resp);
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
