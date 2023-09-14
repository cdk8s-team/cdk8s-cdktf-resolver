import * as aws from '@cdktf/provider-aws';
import * as k8s from 'cdk8s';
import * as tf from 'cdktf';
import * as resolver from '../../src';

const cdktfOutDir = process.env.CDKTF_OUT_DIR ?? 'cdktf.out';
const cdk8sOutDir = process.env.CDK8S_OUT_DIR ?? 'dist';
const stackName = process.env.STACK_NAME ?? 'stack';
const chartName = process.env.CHART_NAME ?? 'chart';

const awsApp = new tf.App({ outdir: cdktfOutDir });
const k8sApp = new k8s.App({ outdir: cdk8sOutDir, resolvers: [new resolver.CdktfResolver({ app: awsApp })] });

const stack = new tf.TerraformStack(awsApp, stackName);
const chart = new k8s.Chart(k8sApp, chartName);

new aws.provider.AwsProvider(stack, 'AWSProvider', {
  region: 'us-east-1',
});

new tf.S3Backend(stack, { bucket: 'epolon-us-east-1-terraform', key: 'tf.state', region: 'us-east-1' });

const topic1 = new aws.snsTopic.SnsTopic(stack, 'Topic1');
const topic2 = new aws.snsTopic.SnsTopic(stack, 'Topic2');

const simpleOutput = new tf.TerraformOutput(stack, 'Simple', {
  value: topic1.name,
});

const concatWithLiteralOutput = new tf.TerraformOutput(stack, 'ConcatWithLiteral', {
  value: `prefix:${topic1.name}`,
});

const concatTwoTokensOutput = new tf.TerraformOutput(stack, 'ConcatTwoTokens', {
  value: `${topic1.name}${topic2.name}`,
});

new k8s.ApiObject(chart, 'ConfigMap', {
  apiVersion: 'v1',
  kind: 'ConfigMap',
  data: {
    Outputs: {
      [stackName]: buildOutputsData(simpleOutput, concatWithLiteralOutput, concatTwoTokensOutput),
    },
  },
});

function buildOutputsData(...outputs: tf.TerraformOutput[]) {

  const outputsData: any = {};

  for (const output of outputs) {
    outputsData[output.node.id] = output.value;
  }

  return outputsData;
}

awsApp.synth();
k8sApp.synth();