import { Cdk8sTeamJsiiProject } from '@cdk8s/projen-common';
const project = new Cdk8sTeamJsiiProject({
  defaultReleaseBranch: 'main',
  name: '@cdk8s/cdktf-resolver',
  projenrcTs: true,
  release: true,
  devDeps: ['@cdk8s/projen-common', 'cdktf-cli', 'cdk8s-cli', '@cdktf/provider-aws', 'fs-extra', '@types/fs-extra'],
  peerDeps: ['cdktf', 'cdk8s', 'constructs'],
  jsiiVersion: '^5',
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

project.synth();

function jest(args: string) {
  // we override 'testPathIgnorePatterns' and 'testMatch' so that it matches only integration tests
  // see https://github.com/jestjs/jest/issues/7914
  return `jest --verbose --testMatch "<rootDir>/test/integ/**/*.test.ts" --testPathIgnorePatterns "/node_modules/" --passWithNoTests --all --updateSnapshot --coverageProvider=v8 ${args}`;
};
