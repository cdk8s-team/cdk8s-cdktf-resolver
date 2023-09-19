import { execFileSync } from 'child_process';
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
  private readonly projectDir: string;

  constructor(props: CdktfResolverProps) {
    this.app = props.app;
    this.projectDir = this.createProject();
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
      // if both cdk8s and AWS CDK applications are defined within the same file,
      // a cdk8s synth is going to happen before the AWS CDK deployment.
      // in this case we must swallow the error, otherwise the AWS CDK deployment
      // won't be able to go through. we replace the value with something to indicate
      // that a fetching attempt was made and failed.
      context.replaceValue(`Failed fetching value for output ${output.node.path}: ${err}`);
    }

  }

  private createProject(): string {

    // cdktf-cli validates the existence of cdktf.json (along with these keys)
    // across all commands regardless of whether the command
    // needs it or not.

    const cdktfJson = {
      // `cdktf output` doesn't actually use this value,
      // so we can put whatever we want here.
      language: 'python',
      app: this.app.outdir,
    };

    const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cdktf-project-'));
    this.app.synth();

    fs.writeFileSync(path.join(projectDir, 'cdktf.json'), JSON.stringify(cdktfJson));

    return projectDir;

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

  private fetchOutputValue(output: TerraformOutput) {

    const script = path.join(__dirname, '..', 'lib', 'fetch-output-value.js');
    return JSON.parse(execFileSync(process.execPath, [
      script,
      this.projectDir,
      this.app.outdir,
      TerraformStack.of(output).node.id,
      output.node.id,
    ], { encoding: 'utf-8', stdio: ['pipe'] }).toString().trim());

  }

  private isAddressable(object: any): object is ITerraformAddressable {
    return object && typeof object === 'object' && !Array.isArray(object) && 'fqn' in object;
  }


}
