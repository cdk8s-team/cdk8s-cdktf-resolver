import { Cdk8sTeamJsiiProject } from '@cdk8s/projen-common';
import { NpmAccess } from 'projen/lib/javascript';
const project = new Cdk8sTeamJsiiProject({
  defaultReleaseBranch: 'main',
  name: '@cdk8s/cdktf-resolver',
  projenrcTs: true,
  release: true,
  devDeps: ['@cdk8s/projen-common', 'cdktf-cli', 'cdk8s-cli', '@cdktf/provider-aws', 'fs-extra', '@types/fs-extra'],
  peerDeps: ['cdktf', 'cdk8s', 'constructs'],
  jsiiVersion: '^5',
  releaseWorkflowSetupSteps: [
    {
      uses: 'aws-actions/configure-aws-credentials@v3',
      with: {
        'aws-region': 'us-east-1',
        'role-to-assume': '${{ secrets.AWS_ROLE_TO_ASSUME }}',
        'role-session-name': 'cdk8s-awscdk-resolver-release',
      },
    },
    {
      name: 'Install terraform | GPG',
      run: 'wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg',
    },
    {
      name: 'Install terraform | Sources',
      run: 'echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list',
    },
    {
      name: 'Install terraform | Binary',
      run: 'sudo apt update && sudo apt install terraform',
    },
  ],
  npmAccess: NpmAccess.PUBLIC,
});

// ignore integ tests because we will add a dedicated task
// for them that only runs on release
project.jest?.addIgnorePattern('/test/integ/');

const integTask = project.addTask('integ');
integTask.exec(jest('integ/integ.test.ts'));

// run integ on release.
// we don't run it on each PR because it brings security and operational
// issues which are not worth the effort at this moment.
const releaseTask = project.tasks.tryFind('release')!;
releaseTask.exec(`npx projen ${integTask.name}`);

// required for OIDC authentication
const releaseWorkflow = project.tryFindObjectFile('.github/workflows/release.yml');
releaseWorkflow!.addOverride('jobs.release.permissions.id-token', 'write');

project.package.addField("resolutions", {
  "cross-spawn": "^7.0.6"
});

project.synth();

function jest(args: string) {
  // we override 'testPathIgnorePatterns' and 'testMatch' so that it matches only integration tests
  // see https://github.com/jestjs/jest/issues/7914
  return `jest --verbose --testMatch "<rootDir>/test/integ/**/*.test.ts" --testPathIgnorePatterns "/node_modules/" --passWithNoTests --all --updateSnapshot --coverageProvider=v8 ${args}`;
};
