var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/new', (req, res) => {
  res.render('/new')
})


router.post('/products', async (req, res) => {
  const newProduct = new Product(req.body);
  console.log(newProduct);
  res.send('asd')


})
module.exports = router;
