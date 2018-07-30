const express = require('express');

const router = express.Router();
const Result = require('../models/resultDb');

// live result
router.get('/results', (req, res, next) => {
    Result.find({}, (err, allResults) => {
        if (err) {
            return next(err);
        }
        res.render('results', { title: 'results', results: allResults });
    });
});

//  show one result
router.get('/results/:id', (req, res, next) => {
    Result.findById(req.params.id, (err, foundResult) => {
        if (err) {
            return next(err);
        }
        // console.log(foundResult);
        res.render('showresult', { title: 'result', result: foundResult });
    });
});


module.exports = router;
