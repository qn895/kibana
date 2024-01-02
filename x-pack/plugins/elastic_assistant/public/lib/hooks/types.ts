/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import type { CoreStart } from '@kbn/core/public';

import type {
  ActionTypeRegistryContract,
  TriggersAndActionsUIPublicPluginStart,
} from '@kbn/triggers-actions-ui-plugin/public';

export interface ElasticAssistantPublicPluginSetup { }
export interface ElasticAssistantPublicPluginSetupDeps { }
export interface ElasticAssistantPublicPluginStart { }
export interface ElasticAssistantPublicPluginStartDeps extends CoreStart {
  actionTypeRegistry: ActionTypeRegistryContract;
  triggersActionsUi: TriggersAndActionsUIPublicPluginStart;
  // docLinks: DocLinksStart;
}
