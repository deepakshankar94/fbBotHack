const express = require('express')
const app = express()

app.get('/', function (req, res) {
  res.send('I love roshu');
})

app.listen(process.env.PORT || 3000, function () {
  console.log('Example app listening on port ' +process.env.PORT || 3000 )
})