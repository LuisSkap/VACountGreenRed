// import express from 'express';
// import {dirname, join} from 'path';
// import {fileURLToPath} from 'url';

const express = require('express');
const path = require('path');
//const fileURLToPath = require('url');

const app = express()

//const __dirname = dirname(fileURLToPath(import.meta.url))

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.get('/', (req, res) => res.render('index'))

app.use(express.static(path.join(__dirname, 'public')))

// console.log(join(__dirname, 'public'))

app.listen(3000)
console.log('Server is listening on port: ', 3000)