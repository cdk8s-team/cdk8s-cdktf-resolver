import { Cdk8sTeamJsiiProject } from "@cdk8s/projen-common";
const project = new Cdk8sTeamJsiiProject({
  defaultReleaseBranch: "main",
  name: "cdk8s-cdktf-resolver",
  projenrcTs: true,
  release: false,

  // deps: [],                /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // devDeps: [],             /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
});
project.synth();