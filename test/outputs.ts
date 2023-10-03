import * as tf from 'cdktf';

// this function simulates how `cdktf output` builds the outputs dictionary so we can
// assert against the actual structure.
export function buildOutputsData(app: tf.App, value: (output: tf.TerraformOutput) => string) {

  const data: any = {};
  const outputs = app.node.findAll().filter((c) => tf.TerraformOutput.isTerraformOutput(c)) as tf.TerraformOutput[];

  for (const output of outputs) {

    const stack = tf.TerraformStack.of(output);

    if (data[stack.node.id] == null) {
      data[stack.node.id] = {};
    }

    data[stack.node.id][output.friendlyUniqueId] = value(output);
  }

  return data;

}
