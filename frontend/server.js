const express = require('express');
const path = require('path');

const app = express();
const port = Number(process.env.PORT) || 5173;

app.use(express.static(path.join(__dirname, 'public')));

app.listen(port, () => {
  console.log(`Interfaz Mar-Yen disponible en el puerto ${port}`);
});