import express from 'express';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const app = express();
const port = 8000;
const cwd = process.cwd();

const gundanListPath = path.resolve(__dirname, './data/list_gundan.txt');
const charutListPath = path.resolve(__dirname, './data/list_charut.txt');

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/gundan', (req, res) => {
  const list = fs.readFileSync(gundanListPath, 'utf-8');

  res.send(list);
});

app.post('/gundan', (req, res) => {
  res.send('get gundan');
});

app.delete('/gundan', (req, res) => {
  res.send('get gundan');
});

app.get('/charut', (req, res) => {
  const list = fs.readFileSync(charutListPath, 'utf-8');

  res.send(list);
});

app.post('/charut', (req, res) => {
  res.send('get gundan');
});

app.delete('/charut', (req, res) => {
  res.send('get gundan');
});

app.listen(port, () => {
  console.log(`seed-bot listening on port ${port}`);
});
