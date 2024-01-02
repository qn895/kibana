/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { CoreStart } from '@kbn/core/public';
import { Plugin } from '@kbn/core/public';


import { type CoreSetup } from '@kbn/core/public';
import { LazyAssistantProvider } from './lazy_loaded_assistant_provider';
import type {
  ElasticAssistantPublicPluginSetup,
  ElasticAssistantPublicPluginSetupDeps,
  ElasticAssistantPublicPluginStart,
  ElasticAssistantPublicPluginStartDeps,
} from './lib/hooks/types';

export type ElasticAssistantCoreSetup = CoreSetup<
  ElasticAssistantPublicPluginStartDeps,
  ElasticAssistantPublicPluginStart
>;

export class ElasticAssistantPublicPlugin
  implements
  Plugin<
  ElasticAssistantPublicPluginSetup,
  ElasticAssistantPublicPluginStart,
  ElasticAssistantPublicPluginSetupDeps,
  ElasticAssistantPublicPluginStartDeps
  >
{
  public setup(
    core: CoreSetup<ElasticAssistantPublicPluginStartDeps, ElasticAssistantPublicPluginStart>,
    plugins: ElasticAssistantPublicPluginSetupDeps
  ): ElasticAssistantPublicPluginSetup {
    return {};
  }
  public start(core: CoreStart) {
    return {
      'test': 'test',
      // AssistantProvider: LazyAssistantProvider

    };
  }
  public stop(): void { }

}
