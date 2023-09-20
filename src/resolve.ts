import * as child from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { IResolver, ResolutionContext } from 'cdk8s';
import { Token, TerraformOutput, TerraformStack, App, ITerraformAddressable } from 'cdktf';

export interface CdktfResolverProps {

  /**
   * The CDKTF App instance in which the outputs are deinfed in.
   */
  readonly app: App;
}

export class CdktfResolver implements IResolver {

  private readonly app: App;

  private _outputs: any;

  constructor(props: CdktfResolverProps) {
    this.app = props.app;
  }

  public resolve(context: ResolutionContext) {

    // detects full resources being passed as values.
    // this is legit in terraform and should resolve
    // to the resource fqn.
    // see https://github.com/hashicorp/terraform-cdk/blob/main/packages/cdktf/lib/terraform-output.ts#L79
    const addressable = this.isAddressable(context.value);

    if (!Token.isUnresolved(context.value) && !addressable) {
      return;
    }

    const output = this.findOutput(context.value);
    try {
      const outputValue = this.fetchOutputValue(output);
      context.replaceValue(outputValue);
    } catch (err) {
      // if both cdk8s and CDKTF applications are defined within the same file,
      // a cdk8s synth is going to happen before the CDKTF deployment.
      // in this case we must swallow the error, otherwise the CDKTF deployment
      // won't be able to go through. we replace the value with something to indicate
      // that a fetching attempt was made and failed.
      context.replaceValue(`Failed fetching value for output ${output.node.path}: ${err}`);
    }

  }

  private fetchOutputValue(output: TerraformOutput) {
    if (!this._outputs) {
      this._outputs = this.fetchOutputs();
    }
    return this._outputs[TerraformStack.of(output).node.id][output.node.id];
  }

  private fetchOutputs(): any {

    const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cdktf-project-'));
    const outputsFile = 'outputs.json';

    try {

      this.app.synth();

      const cdktfJson = {
        // `cdktf output` doesn't actually use this value,
        // so we can put whatever we want here.
        language: 'python',
        app: 'cdktf.out',
      };

      // create our own copy of the synthesized app so we can safely clean it up
      copyDirectory(this.app.outdir, path.join(projectDir, cdktfJson.app));

      // write the configuration file as it is required for any cdktf command
      fs.writeFileSync(path.join(projectDir, 'cdktf.json'), JSON.stringify(cdktfJson));

      const stacks = this.app.node.findAll().filter(c => TerraformStack.isStack(c)).map(c => c.node.id);

      const command = ['cdktf output',
        '--skip-synth',
        `--output ${cdktfJson.app}`,
        `--outputs-file ${outputsFile}`,
        `${stacks.join(',')}`];

      child.execSync(command.join(' '), { cwd: projectDir });

      return JSON.parse(fs.readFileSync(path.join(projectDir, outputsFile), { encoding: 'utf-8' }));

    } finally {
      fs.rmSync(projectDir, { recursive: true });
    }
  }

  private findOutput(value: any): TerraformOutput {

    const inspectedStacks: TerraformStack[] = this.app.node.findAll().filter(c => TerraformStack.isStack(c)) as TerraformStack[];

    for (const stack of inspectedStacks) {
      const output = stack.node.findAll().filter(c => c instanceof TerraformOutput && c.value === value)[0] as TerraformOutput;
      // we don't really care if there are more outputs (possibly from different stacks)
      // that point to the same value. the first will suffice.
      if (output) return output;
    }

    // This can happen if either:
    // --------------------------
    //  1. User didn't define an output.
    //  2. User defined a complex literal output value (e.g { bucketName: bucket.bucket }).
    throw new Error(`Unable to find output defined for ${value} (Inspected stacks: ${inspectedStacks.map(s => s.node.id).join(',')})`);

  }

  private isAddressable(object: any): object is ITerraformAddressable {
    return object && typeof object === 'object' && !Array.isArray(object) && 'fqn' in object;
  }


}

function copyDirectory(sourceDir: string, targetDir: string): void {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir);
  }
  const files = fs.readdirSync(sourceDir);

  for (const file of files) {
    const sourceFilePath = path.join(sourceDir, file);
    const targetFilePath = path.join(targetDir, file);
    const stats = fs.statSync(sourceFilePath);

    if (stats.isDirectory()) {
      copyDirectory(sourceFilePath, targetFilePath);
    } else if (stats.isFile()) {
      fs.copyFileSync(sourceFilePath, targetFilePath);
    }
  }
}