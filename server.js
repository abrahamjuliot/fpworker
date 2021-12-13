const express = require('express')
const path = require('path')
const staticPath = path.join(__dirname, '/')
const app = express()

app.use(express.static(staticPath))

app.listen(8000, () => console.log('⚡'))