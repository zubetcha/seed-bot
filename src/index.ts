import express from 'express';

const app = express();
const port = 8000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/gundan', (req, res) => {
  res.send('get gundan');
});

app.post('/gundan', (req, res) => {
  res.send('get gundan');
});

app.delete('/gundan', (req, res) => {
  res.send('get gundan');
});

app.get('/charut', (req, res) => {
  res.send('get gundan');
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
