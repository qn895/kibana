[Cases Client API Interface](../README.md) / [client](../modules/client.md) / [\_internal\_namespace](../modules/client._internal_namespace.md) / PreConfiguredAction

# Interface: PreConfiguredAction<Config, Secrets\>

[client](../modules/client.md).[_internal_namespace](../modules/client._internal_namespace.md).PreConfiguredAction

## Type parameters

| Name | Type |
| :------ | :------ |
| `Config` | extends [`ActionTypeConfig`](../modules/client._internal_namespace.md#actiontypeconfig) = [`ActionTypeConfig`](../modules/client._internal_namespace.md#actiontypeconfig) |
| `Secrets` | extends [`ActionTypeSecrets`](../modules/client._internal_namespace.md#actiontypesecrets) = [`ActionTypeSecrets`](../modules/client._internal_namespace.md#actiontypesecrets) |

## Hierarchy

- [`ActionResult`](client._internal_namespace.ActionResult.md)<`Config`\>

  ↳ **`PreConfiguredAction`**

## Table of contents

### Properties

- [actionTypeId](client._internal_namespace.PreConfiguredAction.md#actiontypeid)
- [config](client._internal_namespace.PreConfiguredAction.md#config)
- [id](client._internal_namespace.PreConfiguredAction.md#id)
- [isMissingSecrets](client._internal_namespace.PreConfiguredAction.md#ismissingsecrets)
- [isPreconfigured](client._internal_namespace.PreConfiguredAction.md#ispreconfigured)
- [name](client._internal_namespace.PreConfiguredAction.md#name)
- [secrets](client._internal_namespace.PreConfiguredAction.md#secrets)

## Properties

### actionTypeId

• **actionTypeId**: `string`

#### Inherited from

[ActionResult](client._internal_namespace.ActionResult.md).[actionTypeId](client._internal_namespace.ActionResult.md#actiontypeid)

#### Defined in

x-pack/plugins/actions/target/types/server/types.d.ts:50

___

### config

• `Optional` **config**: `Config`

#### Inherited from

[ActionResult](client._internal_namespace.ActionResult.md).[config](client._internal_namespace.ActionResult.md#config)

#### Defined in

x-pack/plugins/actions/target/types/server/types.d.ts:53

___

### id

• **id**: `string`

#### Inherited from

[ActionResult](client._internal_namespace.ActionResult.md).[id](client._internal_namespace.ActionResult.md#id)

#### Defined in

x-pack/plugins/actions/target/types/server/types.d.ts:49

___

### isMissingSecrets

• `Optional` **isMissingSecrets**: `boolean`

#### Inherited from

[ActionResult](client._internal_namespace.ActionResult.md).[isMissingSecrets](client._internal_namespace.ActionResult.md#ismissingsecrets)

#### Defined in

x-pack/plugins/actions/target/types/server/types.d.ts:52

___

### isPreconfigured

• **isPreconfigured**: `boolean`

#### Inherited from

[ActionResult](client._internal_namespace.ActionResult.md).[isPreconfigured](client._internal_namespace.ActionResult.md#ispreconfigured)

#### Defined in

x-pack/plugins/actions/target/types/server/types.d.ts:54

___

### name

• **name**: `string`

#### Inherited from

[ActionResult](client._internal_namespace.ActionResult.md).[name](client._internal_namespace.ActionResult.md#name)

#### Defined in

x-pack/plugins/actions/target/types/server/types.d.ts:51

___

### secrets

• **secrets**: `Secrets`

#### Defined in

x-pack/plugins/actions/target/types/server/types.d.ts:57
