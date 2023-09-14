import * as aws from '@cdktf/provider-aws';
import * as cdk8s from 'cdk8s';
import * as tf from 'cdktf';
import * as resolve from '../src/resolve';

const tfResolver = new tf.DefaultTokenResolver(new tf.StringConcat());

function fetchOutputValue(output: tf.TerraformOutput) {

  // this takes care of resolving any form of value (e.g ITerraformAddressable) into its token representation.
  const outputValue = output.toTerraform().output[output.friendlyUniqueId].value;

  // which can then be safely resolved.
  return tf.Tokenization.resolve(outputValue, {
    scope: output,
    preparing: false,
    resolver: tfResolver,
  },
  );
}

test('can resolve direct output value', () => {
  const awsApp = new tf.App();

  const resolver = createResolver(awsApp);

  const stack = new tf.TerraformStack(awsApp, 'Stack');
  const chart = new cdk8s.Chart(
    cdk8s.Testing.app({ resolvers: [resolver] }),
    'Chart',
  );

  const bucket = new aws.s3Bucket.S3Bucket(stack, 'Bucket');

  const output = new tf.TerraformOutput(stack, 'Output', {
    value: bucket.bucket,
  });

  const obj = new cdk8s.ApiObject(chart, 'ApiObject', {
    apiVersion: 'v1',
    kind: 'Struct',
    spec: {
      prop1: output.value,
    },
  });

  expect(obj.toJson()).toMatchInlineSnapshot(`
    Object {
      "apiVersion": "v1",
      "kind": "Struct",
      "metadata": Object {
        "name": "chart-apiobject-c830d7bd",
      },
      "spec": Object {
        "prop1": "\${aws_s3_bucket.Bucket.bucket}",
      },
    }
  `);
});

test('can resolve indirect output value', () => {
  const awsApp = new tf.App();

  const resolver = createResolver(awsApp);

  const stack = new tf.TerraformStack(awsApp, 'Stack');
  const chart = new cdk8s.Chart(
    cdk8s.Testing.app({ resolvers: [resolver] }),
    'Chart',
  );

  const bucket = new aws.s3Bucket.S3Bucket(stack, 'Bucket');
  const bucketName = bucket.bucket;

  new tf.TerraformOutput(stack, 'Output', {
    value: bucketName,
  });

  const obj = new cdk8s.ApiObject(chart, 'ApiObject', {
    apiVersion: 'v1',
    kind: 'Struct',
    spec: {
      prop1: bucketName,
    },
  });

  expect(obj.toJson()).toMatchInlineSnapshot(`
    Object {
      "apiVersion": "v1",
      "kind": "Struct",
      "metadata": Object {
        "name": "chart-apiobject-c830d7bd",
      },
      "spec": Object {
        "prop1": "\${aws_s3_bucket.Bucket.bucket}",
      },
    }
  `);
});

test('can resolve numbers', () => {
  const awsApp = new tf.App();

  const resolver = createResolver(awsApp);

  const stack = new tf.TerraformStack(awsApp, 'Stack');
  const chart = new cdk8s.Chart(
    cdk8s.Testing.app({ resolvers: [resolver] }),
    'Chart',
  );

  const bucket = new aws.s3Bucket.S3Bucket(stack, 'Bucket');

  const output = new tf.TerraformOutput(stack, 'Output', {
    value: bucket.getNumberAttribute('attr'),
  });

  const obj = new cdk8s.ApiObject(chart, 'ApiObject', {
    apiVersion: 'v1',
    kind: 'Struct',
    spec: {
      prop1: output.value,
    },
  });

  expect(obj.toJson()).toMatchInlineSnapshot(`
    Object {
      "apiVersion": "v1",
      "kind": "Struct",
      "metadata": Object {
        "name": "chart-apiobject-c830d7bd",
      },
      "spec": Object {
        "prop1": "\${aws_s3_bucket.Bucket.attr}",
      },
    }
  `);
});

test('can resolve booleans', () => {
  const awsApp = new tf.App();

  const resolver = createResolver(awsApp);

  const stack = new tf.TerraformStack(awsApp, 'Stack');
  const chart = new cdk8s.Chart(
    cdk8s.Testing.app({ resolvers: [resolver] }),
    'Chart',
  );

  const bucket = new aws.s3Bucket.S3Bucket(stack, 'Bucket');

  const output = new tf.TerraformOutput(stack, 'Output', {
    value: bucket.getBooleanAttribute('attr'),
  });

  const obj = new cdk8s.ApiObject(chart, 'ApiObject', {
    apiVersion: 'v1',
    kind: 'Struct',
    spec: {
      prop1: output.value,
    },
  });

  expect(obj.toJson()).toMatchInlineSnapshot(`
    Object {
      "apiVersion": "v1",
      "kind": "Struct",
      "metadata": Object {
        "name": "chart-apiobject-c830d7bd",
      },
      "spec": Object {
        "prop1": "\${aws_s3_bucket.Bucket.attr}",
      },
    }
  `);
});

test('can resolve token maps', () => {
  const awsApp = new tf.App();

  const resolver = createResolver(awsApp);

  const stack = new tf.TerraformStack(awsApp, 'Stack');
  const chart = new cdk8s.Chart(
    cdk8s.Testing.app({ resolvers: [resolver] }),
    'Chart',
  );

  const bucket = new aws.s3Bucket.S3Bucket(stack, 'Bucket');

  const output = new tf.TerraformOutput(stack, 'Output', {
    value: bucket.getAnyMapAttribute('attr'),
  });

  const obj = new cdk8s.ApiObject(chart, 'ApiObject', {
    apiVersion: 'v1',
    kind: 'Struct',
    spec: {
      prop1: output.value,
    },
  });

  expect(obj.toJson()).toMatchInlineSnapshot(`
    Object {
      "apiVersion": "v1",
      "kind": "Struct",
      "metadata": Object {
        "name": "chart-apiobject-c830d7bd",
      },
      "spec": Object {
        "prop1": "\${aws_s3_bucket.Bucket.attr}",
      },
    }
  `);
});

test('cannot resolve literal maps', () => {
  const awsApp = new tf.App();

  const resolver = createResolver(awsApp);

  const stack = new tf.TerraformStack(awsApp, 'Stack');
  const chart = new cdk8s.Chart(
    cdk8s.Testing.app({ resolvers: [resolver] }),
    'Chart',
  );

  const bucket = new aws.s3Bucket.S3Bucket(stack, 'Bucket');
  const bucketName = bucket.bucket;

  const output = new tf.TerraformOutput(stack, 'Output', {
    value: { bucketName },
  });

  const obj = new cdk8s.ApiObject(chart, 'ApiObject', {
    apiVersion: 'v1',
    kind: 'Struct',
    spec: {
      prop1: output.value,
    },
  });

  // note the error message refers to the `bucketName` token, instead of the output value.
  // this is unfortunate, but unavoidable because the literal map is traversed by the ubmrella resolving logic
  // in cdk8s-core, and the value being passed to and inspected by this resolver is only `bucketName`.
  expect(() => obj.toJson()).toThrowError(
    `Unable to find output defined for ${bucketName} (Inspected stacks: Stack)`,
  );
});

test('can resolve token arrays', () => {
  const awsApp = new tf.App();

  const resolver = createResolver(awsApp);

  const stack = new tf.TerraformStack(awsApp, 'Stack');
  const chart = new cdk8s.Chart(
    cdk8s.Testing.app({ resolvers: [resolver] }),
    'Chart',
  );

  const bucket = new aws.s3Bucket.S3Bucket(stack, 'Bucket');

  const output = new tf.TerraformOutput(stack, 'Output', {
    value: bucket.getListAttribute('attr'),
  });

  const obj = new cdk8s.ApiObject(chart, 'ApiObject', {
    apiVersion: 'v1',
    kind: 'Struct',
    spec: {
      prop1: output.value,
    },
  });

  expect(obj.toJson()).toMatchInlineSnapshot(`
    Object {
      "apiVersion": "v1",
      "kind": "Struct",
      "metadata": Object {
        "name": "chart-apiobject-c830d7bd",
      },
      "spec": Object {
        "prop1": "\${aws_s3_bucket.Bucket.attr}",
      },
    }
  `);
});

test('cannot resolve literal arrays', () => {
  const awsApp = new tf.App();

  const resolver = createResolver(awsApp);

  const stack = new tf.TerraformStack(awsApp, 'Stack');
  const chart = new cdk8s.Chart(
    cdk8s.Testing.app({ resolvers: [resolver] }),
    'Chart',
  );

  const bucket = new aws.s3Bucket.S3Bucket(stack, 'Bucket');
  const bucketName = bucket.bucket;

  const output = new tf.TerraformOutput(stack, 'Output', {
    value: [bucketName],
  });

  const obj = new cdk8s.ApiObject(chart, 'ApiObject', {
    apiVersion: 'v1',
    kind: 'Struct',
    spec: {
      prop1: output.value,
    },
  });

  // note the error message refers to the `bucketName` token, instead of the output value.
  // this is unfortunate, but unavoidable because the literal array is traversed by the ubmrella resolving logic
  // in cdk8s-core, and the value being passed to and inspected by this resolver is only `bucketName`.
  expect(() => obj.toJson()).toThrowError(
    `Unable to find output defined for ${bucketName} (Inspected stacks: Stack)`,
  );
});

test('can resolve expressions', () => {
  const awsApp = new tf.App();

  const resolver = createResolver(awsApp);

  const stack = new tf.TerraformStack(awsApp, 'Stack');
  const chart = new cdk8s.Chart(
    cdk8s.Testing.app({ resolvers: [resolver] }),
    'Chart',
  );

  const bucket = new aws.s3Bucket.S3Bucket(stack, 'Bucket');

  const output = new tf.TerraformOutput(stack, 'Output', {
    value: tf.Fn.upper(bucket.bucket),
  });

  const obj = new cdk8s.ApiObject(chart, 'ApiObject', {
    apiVersion: 'v1',
    kind: 'Struct',
    spec: {
      prop1: output.value,
    },
  });

  expect(obj.toJson()).toMatchInlineSnapshot(`
    Object {
      "apiVersion": "v1",
      "kind": "Struct",
      "metadata": Object {
        "name": "chart-apiobject-c830d7bd",
      },
      "spec": Object {
        "prop1": "\${upper(aws_s3_bucket.Bucket.bucket)}",
      },
    }
  `);
});

test('can resolve resource', () => {
  const awsApp = new tf.App();

  const resolver = createResolver(awsApp);

  const stack = new tf.TerraformStack(awsApp, 'Stack');
  const chart = new cdk8s.Chart(
    cdk8s.Testing.app({ resolvers: [resolver] }),
    'Chart',
  );

  const bucket = new aws.s3Bucket.S3Bucket(stack, 'Bucket');

  const output = new tf.TerraformOutput(stack, 'Output', {
    value: bucket,
  });

  const obj = new cdk8s.ApiObject(chart, 'ApiObject', {
    apiVersion: 'v1',
    kind: 'Struct',
    spec: {
      prop1: output.value,
    },
  });

  expect(obj.toJson()).toMatchInlineSnapshot(`
    Object {
      "apiVersion": "v1",
      "kind": "Struct",
      "metadata": Object {
        "name": "chart-apiobject-c830d7bd",
      },
      "spec": Object {
        "prop1": "\${aws_s3_bucket.Bucket}",
      },
    }
  `);
});

function createResolver(app: tf.App) {
  const resolver = new resolve.CdktfResolver({ app });
  (resolver as any).fetchOutputValue = fetchOutputValue;
  return resolver;
}
