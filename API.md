# replace this
# API Reference <a name="API Reference" id="api-reference"></a>


## Structs <a name="Structs" id="Structs"></a>

### CdktfResolverProps <a name="CdktfResolverProps" id="cdk8s-cdktf-resolver.CdktfResolverProps"></a>

#### Initializer <a name="Initializer" id="cdk8s-cdktf-resolver.CdktfResolverProps.Initializer"></a>

```typescript
import { CdktfResolverProps } from 'cdk8s-cdktf-resolver'

const cdktfResolverProps: CdktfResolverProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk8s-cdktf-resolver.CdktfResolverProps.property.app">app</a></code> | <code>cdktf.App</code> | The CDKTF App instance in which the outputs are deinfed in. |

---

##### `app`<sup>Required</sup> <a name="app" id="cdk8s-cdktf-resolver.CdktfResolverProps.property.app"></a>

```typescript
public readonly app: App;
```

- *Type:* cdktf.App

The CDKTF App instance in which the outputs are deinfed in.

---

## Classes <a name="Classes" id="Classes"></a>

### CdktfResolver <a name="CdktfResolver" id="cdk8s-cdktf-resolver.CdktfResolver"></a>

- *Implements:* cdk8s.IResolver

#### Initializers <a name="Initializers" id="cdk8s-cdktf-resolver.CdktfResolver.Initializer"></a>

```typescript
import { CdktfResolver } from 'cdk8s-cdktf-resolver'

new CdktfResolver(props: CdktfResolverProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk8s-cdktf-resolver.CdktfResolver.Initializer.parameter.props">props</a></code> | <code><a href="#cdk8s-cdktf-resolver.CdktfResolverProps">CdktfResolverProps</a></code> | *No description.* |

---

##### `props`<sup>Required</sup> <a name="props" id="cdk8s-cdktf-resolver.CdktfResolver.Initializer.parameter.props"></a>

- *Type:* <a href="#cdk8s-cdktf-resolver.CdktfResolverProps">CdktfResolverProps</a>

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk8s-cdktf-resolver.CdktfResolver.resolve">resolve</a></code> | This function is invoked on every property during cdk8s synthesis. |

---

##### `resolve` <a name="resolve" id="cdk8s-cdktf-resolver.CdktfResolver.resolve"></a>

```typescript
public resolve(context: ResolutionContext): void
```

This function is invoked on every property during cdk8s synthesis.

To replace a value, implementations must invoke `context.replaceValue`.

###### `context`<sup>Required</sup> <a name="context" id="cdk8s-cdktf-resolver.CdktfResolver.resolve.parameter.context"></a>

- *Type:* cdk8s.ResolutionContext

---





