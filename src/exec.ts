import * as child from 'child_process';

export interface ExecSyncOptions {
  readonly cwd?: string;
  readonly env?: { [key: string]: string };
}

export function execSync(command: string, options: ExecSyncOptions = {}) {

  try {
    child.execSync(command, { cwd: options.cwd, env: options.env });
  } catch (err: any) {
    const message = [`Command failed: ${command}`];
    if (err.stderr) {
      message.push('STDERR:');
      message.push('\n');
      message.push('\n');
      message.push(err.stderr.toString().trim());
    }
    if (err.stdout) {
      message.push('STDOUT:');
      message.push('\n');
      message.push('\n');
      message.push(err.stdout.toString().trim());
    }
    throw new Error(message.join('\n\n'));
  }
}