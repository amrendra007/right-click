const express = require('express');

const router = express.Router();

router.get('/contest', (req, res) => {
    res.render('contest', { title: 'contest' });
});

router.post('/contest', (req, res) => {
    console.log(req.body);
    // res.send('k');
    res.render('contest', { title: 'contest' });
});

module.exports = router;
