import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

async function fetchOutputValue(projectDir: string, appDir: string, stackName: string, outputName: string) {

  const outputsFile = 'outputs.json';

  try {
    execSync(`cdktf output --skip-synth --output ${appDir} ${stackName} --outputs-file ${outputsFile}`, {
      cwd: projectDir,
    });
  } finally {
    // lets not leave any leftovers
    fs.unlinkSync(path.join(projectDir, outputsFile));
  }

  const outputs = JSON.parse(fs.readFileSync(path.join(projectDir, outputsFile), { encoding: 'utf-8' }));
  return outputs[stackName][outputName];

}

fetchOutputValue(process.argv[2], process.argv[3], process.argv[4], process.argv[5])
  .then(d => {
    console.log(JSON.stringify(d));
  })
  .catch(_ => {
    throw new Error(`${process.argv[2], process.argv[3], process.argv[4], process.argv[5]}`);
  });
