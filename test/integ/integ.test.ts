import * as os from 'os';
import * as path from 'path';
import { Yaml } from 'cdk8s';
import * as fs from 'fs-extra';
import { execSync } from '../../src/exec';

test('app', () => {

  const appDir = __dirname;
  const appFile = 'app.ts';
  const program = `npx ts-node ${path.join(appDir, appFile)}`;
  const stack1Name = 'cdk8s-cdktf-resolver-app-integ-stack-1';
  const stack2Name = 'cdk8s-cdktf-resolver-app-integ-stack-2';
  const chartName = 'cdk8s-cdktf-resolver-app-integ-chart';

  const outTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'app-test-'));
  const cdktfOutDir = path.join(outTempDir, 'cdktf.out');
  const cdk8sOutDir = path.join(outTempDir, 'dist');
  const outputsFilePath = path.join(outTempDir, 'outputs.json');

  function execProgram(command: string) {
    execSync(command, {
      cwd: appDir,
      env: {
        ...process.env,
        CDKTF_OUT_DIR: cdktfOutDir,
        CDK8S_OUT_DIR: cdk8sOutDir,
        STACK1_NAME: stack1Name,
        STACK2_NAME: stack2Name,
        CHART_NAME: chartName,
      },
    });
  }

  const bin = path.join(__dirname, '..', '..', 'node_modules', '.bin');
  const cdktf = path.join(bin, 'cdktf');
  const cdk8s = path.join(bin, 'cdk8s');

  try {
    execProgram(`${cdktf} deploy --auto-approve -o ${cdktfOutDir} --outputs-file ${outputsFilePath} ${stack1Name} ${stack2Name}`);

    // delete the synthesized app to make sure we don't rely on it in the resolver
    fs.removeSync(cdktfOutDir);

    execProgram(`${cdk8s} synth -o ${cdk8sOutDir} -a '${program}'`);

    const outputs = JSON.parse(fs.readFileSync(outputsFilePath, { encoding: 'utf-8' }));
    const manifest = Yaml.load(path.join(cdk8sOutDir, `${chartName}.k8s.yaml`));

    // validate that the manifest indeed includes the correct outputs
    console.log(JSON.stringify(manifest));
    console.log(JSON.stringify(outputs));
    expect(outputs).toStrictEqual(manifest[0].data.Outputs);

  } finally {
    execProgram(`${cdktf} destroy --auto-approve -o ${cdktfOutDir} ${stack1Name} ${stack2Name}`);
  }

});
