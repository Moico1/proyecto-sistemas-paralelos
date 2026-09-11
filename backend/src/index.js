const express = require('express');
const cors = require('cors');
const asistenciaRoutes = require('./routes/asistencia.routes');
const apiRoutes = require('./routes/api.routes');

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());
app.use('/api/asistencia', asistenciaRoutes);
app.use('/api', apiRoutes);

app.get('/health', (_req, res) => {
  res.status(200).json({ estado: 'ok' });
});

app.listen(port, () => {
  console.log(`API Mar-Yen escuchando en el puerto ${port}`);
});