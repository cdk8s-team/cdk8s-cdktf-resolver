import * as aws from '@cdktf/provider-aws';
import * as k8s from 'cdk8s';
import * as tf from 'cdktf';
import { Construct } from 'constructs';
import * as resolver from '../../src';

const cdktfOutDir = process.env.CDKTF_OUT_DIR ?? 'cdktf.out';
const cdk8sOutDir = process.env.CDK8S_OUT_DIR ?? 'dist';
const stack1Name = process.env.STACK1_NAME ?? 'stack1';
const stack2Name = process.env.STACK2_NAME ?? 'stack2';
const chartName = process.env.CHART_NAME ?? 'chart';

const region = 'us-east-1';

const awsApp = new tf.App({ outdir: cdktfOutDir });
const k8sApp = new k8s.App({ outdir: cdk8sOutDir, resolvers: [new resolver.CdktfResolver({ app: awsApp })] });

const chart = new k8s.Chart(k8sApp, chartName);

addStack(stack1Name);
addStack(stack2Name);

new k8s.ApiObject(chart, 'ConfigMap', {
  apiVersion: 'v1',
  kind: 'ConfigMap',
  data: {
    Outputs: buildOutputsData(),
  },
});

function addStack(stackName: string) {

  const stack = new tf.TerraformStack(awsApp, stackName);

  const topic1 = new aws.snsTopic.SnsTopic(stack, 'Topic1');
  const topic2 = new aws.snsTopic.SnsTopic(stack, 'Topic2');

  new tf.TerraformOutput(stack, 'Simple', {
    value: topic1.name,
  });

  // same id but different scope
  const constrcut = new Construct(stack, 'Construct');
  new tf.TerraformOutput(constrcut, 'Simple', {
    value: topic2.name,
  });

  new tf.TerraformOutput(stack, 'ConcatWithLiteral', {
    value: `prefix:${topic1.name}`,
  });

  new tf.TerraformOutput(stack, 'ConcatTwoTokens', {
    value: `${topic1.name}${topic2.name}`,
  });

  new aws.provider.AwsProvider(stack, 'AWSProvider', {
    region,
  });

  new tf.S3Backend(stack, { bucket: 'cdk8s-cdktf-resolver-integ-tests-terraform', key: `${stackName}.state`, region });

}

function buildOutputsData() {

  const outputsData: any = {};

  const stacks = awsApp.node.findAll().filter(c => tf.TerraformStack.isStack(c)) as tf.TerraformStack[];

  for (const stack of stacks) {
    outputsData[stack.node.id] = {};
    for (const output of stack.node.findAll().filter(c => tf.TerraformOutput.isTerraformOutput(c)) as tf.TerraformOutput[]) {
      outputsData[stack.node.id][output.node.id] = output.value;
    }
  }


  return outputsData;
}

awsApp.synth();
k8sApp.synth();