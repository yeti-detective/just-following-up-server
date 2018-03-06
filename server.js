var port = process.env.PORT || 8888
const express = require('express')
const path = require('path')
var app = express()
const cors = require('cors')
const fs = require('fs')

// for decoding JWTs obtained from auth0
const jwt = require('jsonwebtoken')
// client secrets from auth0 shhhhhhhhhhhhhhhhhhhhhhhhhhhh
const auth0keys = require('auth0keys.js')
let webSecret = auth0keys.webSecret
let nativeSecret = auth0keys.nativeSecret

// instantiate the database client
const mongo = require('mongodb').MongoClient
var db

app.use(cors()) // todo: restrict CORS to my domains only

mongo.connect('mongodb://jfuWebClient:JustFollowingUpWebApp@ds149934.mlab.com:49934/just-following-up', (err, database) => {
  if (err) throw err
  db = database

  app.listen(port, () => {
    console.log('server running on port:' + port)
  })
})

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/index.html'))
})

app.get('/invoices', (req, res) => {

  if (req.headers.id_token !== 'null') {
    let user = jwt.decode(req.headers.id_token, (req.headers.client === 'web'? webSecret : nativeSecret))

    db.collection('jfu').find({'_id': user.sub}).toArray((err, result) => {
      if (err) throw err

      if (result.length === 0) {
        let newUser = {
          _id: user.sub,
          details: {
            name: '',
            email: '',
            businessName: '',
            phNum: '',
            customers: []
          }
        }
        db.collection('jfu').save(newUser)
        result.push(newUser)
      }
      res.json(result[0].details)
    })
  } else {
    console.log('db contact success')
    res.send('you aren\'t logged in')
  }
})

app.get('/test', (req, res) => {
  res.json(req.headers)
})

app.post('/test', (req, res) => {
  res.send('successful post')
})

app.post('/invoices/:userData', (req, res) => {
  let token = jwt.decode(req.header('id_token')).sub
  let invoices = JSON.parse(req.params.userData)
  db.collection('jfu').update({"_id": token}, {"details": invoices})
  res.send('updated')
})
