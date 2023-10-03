# CDK For Terraform Resolver

The `CdkTfResolver` is able to resolve any [`TerraformOutput`](https://developer.hashicorp.com/terraform/cdktf/concepts/variables-and-outputs#output-values) 
defined by your CDKTF application. In this example, we create an S3 `Bucket` with the CDKTF, and pass its (deploy time generated) 
name as an environment variable to a Kubernetes `CronJob` resource.

```ts
import * as tf from "cdktf";
import * as aws from "@cdktf/provider-aws";
import * as k8s from 'cdk8s';
import * as kplus from 'cdk8s-plus-26';

import { CdkTfResolver } from '@cdk8s/cdktf-resolver';

const awsApp = new tf.App();
const stack = new tf.TerraformStack(awsApp, 'aws');

const k8sApp = new k8s.App({ resolvers: [new resolver.CdktfResolver({ app: awsApp })] });
const manifest = new k8s.Chart(k8sApp, 'Manifest', { resolver });

const bucket = new aws.s3Bucket.S3Bucket(stack, 'Bucket');
const bucketName = new tf.TerraformOutput(constrcut, 'BucketName', {
  value: bucket.bucket,
});

new kplus.CronJob(manifest, 'CronJob', {
  schedule: k8s.Cron.daily(),
  containers: [{
    image: 'job',
    envVariables: {
      // directly passing the value of the `TerraformOutput` containing 
      // the deploy time bucket name
      BUCKET_NAME: kplus.EnvValue.fromValue(bucketName.value),
    }
 }]
});

awsApp.synth();
k8sApp.synth();
```

During cdk8s synthesis, the custom resolver will detect that `bucketName.value` is not a concrete value, 
but rather a value of a `TerraformOutput`. It will then perform `cdktf` CLI commands in order to fetch the 
actual value from the deployed infrastructure in your account. This means that in order 
for `cdk8s synth` to succeed, it must be executed *after* the CDKTF resources 
have been deployed. So your deployment workflow should (conceptually) be:

1. `cdktf deploy`
2. `cdk8s synth`

> Note that the `CdkTfResolver` is **only** able to fetch tokens that have a `TerraformOutput` defined for them.

##### Permissions

Since running `cdk8s synth` will now require reading terraform outputs, it must have permissions to do so.
In case a remote state file is used, this means providing a set of credentials for the account that have access
to where the state is stored. This will vary depending on your cloud provider, but in most cases will involve giving 
read permissions on a blob storage device (e.g S3 bucket).

Note that the permissions cdk8s require are far more scoped down than those normally required for the 
deployment of CDKTF applications. It is therefore recommended to not reuse the same set of credentials, 
and instead create a scoped down `ReadOnly` role dedicated for cdk8s resolvers.

Following are the set of commands the resolver will execute:

- [`cdktf output`](https://developer.hashicorp.com/terraform/cdktf/cli-reference/commands#output)

## Cross Repository Workflow

As we've seen, your `cdk8s` application needs access to the objects defined in your cloud application. If both applications
are defined within the same file, this is trivial to achieve. If they are in different files, a simple `import` statement will suffice.
However, what if the applications are managed in two separate repositories? This makes it a little trickier, but still possible. 

In this scenario, `cdktf.ts` in the CDKTF application, stored in a dedicated repository.

```ts
import * as tf from "cdktf";
import * as aws from "@cdktf/provider-aws";

import { CdkTfResolver } from '@cdk8s/cdktf-resolver';

const awsApp = new tf.App();
const stack = new tf.TerraformStack(awsApp, 'aws');

const bucket = new aws.s3Bucket.S3Bucket(stack, 'Bucket');
const bucketName = new tf.TerraformOutput(constrcut, 'BucketName', {
  value: bucket.bucket,
});

awsApp.synth();
```

In order for the `cdk8s` application to have cross repository access, the CDKTF object instances 
that we want to expose need to be available via a package repository. To do this, break up the 
CDKTF application into the following files:

`app.ts`

```ts
import * as tf from "cdktf";
import * as aws from "@cdktf/provider-aws";

import { CdkTfResolver } from '@cdk8s/cdktf-resolver';

// export the app so we can pass it to the cdk8s resolver
export const awsApp = new tf.App();
const stack = new tf.TerraformStack(awsApp, 'aws');

const bucket = new aws.s3Bucket.S3Bucket(stack, 'Bucket');
// export the thing we want to have available for cdk8s applications
export const bucketName = new tf.TerraformOutput(constrcut, 'BucketName', {
  value: bucket.bucket,
});

// note that we don't call awsApp.synth here
```

`main.ts`

```ts
import { awsApp } from './app.ts'

awsApp.synth();
```

Now, publish the `app.ts` file to a package manager, so that your `cdk8s` application can install and import it. 
This approach might be somewhat counter intuitive, because normally we only publish classes to the package manager, 
not instances. Indeed, these types of applications introduce a new use-case that requires the sharing of instances.
Conceptually, this is no different than writing state<sup>*</sup> to an SSM parameter or an S3 bucket, and it allows us to remain 
in the boundaries of our programming language, and the typing guarantees it provides.

> <sup>*</sup> Actually, we are only publishing instructions for fetching state, not the state itself.

Assuming `app.ts` was published as the `my-cdktf-app` package, our `cdk8s` application will now look like so:

```ts
import * as k8s from 'cdk8s';
import * as kplus from 'cdk8s-plus-27';

// import the desired instance from the CDKTF app.
import { bucketName, awsApp } from 'my-cdktf-app';

import { CdkTfResolver } from '@cdk8s/cdktf-resolver';

const k8sApp = new k8s.App({ resolvers: [new resolver.CdktfResolver({ app: awsApp })] });
const manifest = new k8s.Chart(k8sApp, 'Manifest');

new kplus.CronJob(manifest, 'CronJob', {
  schedule: k8s.Cron.daily(),
  containers: [{
    image: 'job',
    envVariables: {
      // directly passing the value of the `TerraformOutput` containing 
      // the deploy time bucket name
      BUCKET_NAME: kplus.EnvValue.fromValue(bucketName.value),
    }
 }]
});

k8sApp.synth();
```