const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function loadYaml(file) {
  return yaml.load(fs.readFileSync(file, 'utf8'));
}

function loadAllRules(rulesDir) {
  const rules = {};
  for (const f of fs.readdirSync(rulesDir)) {
    if (!f.endsWith('.yaml') && !f.endsWith('.yml')) continue;
    const full = path.join(rulesDir, f);
    const data = loadYaml(full);
    if (Array.isArray(data)) {
      for (const r of data) rules[`${f}::${r.id}`] = r;
    }
  }
  return rules;
}

function evalCondition(cond, input) {
  try {
    // safe-ish evaluation: provide only input
    return Function('input', `return (${cond});`)(input);
  } catch (e) {
    return false;
  }
}

async function runWorkflow(workflowFile, input) {
  const wf = loadYaml(workflowFile);
  const rulesDir = path.resolve(__dirname, '..', 'rules');
  const rules = loadAllRules(rulesDir);
  const handlersDir = path.resolve(__dirname, 'skills');

  for (const step of wf.steps) {
    console.log(`Step: ${step.id}`);
    // evaluate rules
    if (step.rules) {
      for (const rref of step.rules) {
        const [file, id] = rref.split('::');
        const key = `${file}::${id}`;
        const r = rules[key];
        if (!r) {
          console.log(`  - rule not found: ${rref}`);
          return {status: 'error', reason: `rule not found ${rref}`};
        }
        const ok = evalCondition(r.condition, input);
        console.log(`  - rule ${id}: ${ok}`);
        if (!ok) {
          console.log('  -> rule failed, taking on_failure');
          return {status: 'rejected', step: step.id, rule: id};
        }
      }
    }

    // load skill handler
    const skillName = step.skill.replace(/-/g, '_');
    const handlerPath = path.join(handlersDir, `${skillName}.js`);
    if (!fs.existsSync(handlerPath)) {
      console.log(`  - handler not found: ${handlerPath}`);
      return {status: 'error', reason: `handler not found ${handlerPath}`};
    }
    const handler = require(handlerPath);
    const actionName = step.action.replace(/-/g, '_');
    if (typeof handler[actionName] !== 'function') {
      console.log(`  - action not found: ${step.action}`);
      return {status: 'error', reason: `action not found ${step.action}`};
    }
    const result = await handler[actionName](input);
    console.log(`  - action result: ${JSON.stringify(result)}`);
    if (result && result.status === 'fail') {
      console.log('  -> action failed, taking on_failure');
      return {status: 'rejected', step: step.id, reason: result.reason};
    }
    // allow steps to modify input
    if (result && result.output) input = Object.assign({}, input, result.output);
  }

  return {status: 'completed', output: input};
}

if (require.main === module) {
  const wf = path.resolve(__dirname, '..', 'workflows', 'asistencia_workflow.yaml');
  const sample = path.resolve(__dirname, 'sample-inputs', 'asistencia.json');
  const input = JSON.parse(fs.readFileSync(sample, 'utf8'));
  runWorkflow(wf, input).then(r => console.log('Workflow finished:', r));
}

module.exports = { runWorkflow };
