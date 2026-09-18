const fs = require('fs');
const path = require('path');

async function validate_input(input) {
  // simple validation pass-through
  return { status: 'ok' };
}

async function check_permissions(input) {
  // simple role check example
  const role = input.role || 'CLIENTE';
  if (role === 'ADMIN' || role === 'RECEPCION' || role === 'CLIENTE') return { status: 'ok' };
  return { status: 'fail', reason: 'insufficient_role' };
}

async function db_persist(input) {
  // mock persist: append to agente/runtime/data/asistencia.json
  const dataDir = path.resolve(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const file = path.join(dataDir, 'asistencia.json');
  const arr = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file,'utf8')) : [];
  arr.push({ ts: Date.now(), payload: input });
  fs.writeFileSync(file, JSON.stringify(arr, null, 2));
  return { status: 'ok', output: { persisted: true } };
}

module.exports = { validate_input, check_permissions, db_persist };
