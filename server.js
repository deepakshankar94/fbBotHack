const express = require('express')
const app = express()

app.post('/', function (req, res) {
  
  res.send("post");
})


app.get('/', function (req, res) {
  
  res.send("get");
})
app.listen(process.env.PORT || 3000, function () {
  console.log('Example app listening on port ' +process.env.PORT || 3000 )
})