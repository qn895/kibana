/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { CoreStart, Plugin } from '@kbn/core/public';
import { type CoreSetup } from '@kbn/core/public';
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

export class ElasticAssistantPlugin
  implements
  Plugin<
  ElasticAssistantPublicPluginSetup,
  ElasticAssistantPublicPluginStart,
  ElasticAssistantPublicPluginSetupDeps,
  ElasticAssistantPublicPluginStartDeps
  >
{
  public setup(
    core: ElasticAssistantCoreSetup,
    pluginSetupDeps: ElasticAssistantPublicPluginSetupDeps
  ) {
    // Promise.all([
    //   // firstValueFrom(licensing.license$),
    //   // import('./embeddable/register_embeddable'),
    //   // import('./ui_actions'),
    //   // import('./cases/register_change_point_charts_attachment'),
    //   core.getStartServices(),
    // ]).then(
    //   ([
    //     // license,
    //     // { registerEmbeddable },
    //     // { registerElasticAssistantUiActions },
    //     // { registerChangePointChartsAttachment },
    //     [coreStart, pluginStart],
    //   ]) => {
    //     // @TODO: remove
    //     console.log(`--@@pluginStart`, pluginStart);
    //     // if (license.hasAtLeast('platinum')) {
    //     //   if (embeddable) {
    //     //     registerEmbeddable(core, embeddable);
    //     //   }
    //     //   if (uiActions) {
    //     //     registerElasticAssistantUiActions(uiActions, coreStart, pluginStart);
    //     //   }
    //     //   if (cases) {
    //     //     registerChangePointChartsAttachment(cases, coreStart, pluginStart);
    //     //   }
    //     // }
    //   }
    // );
    return {};
  }

  public start(
    core: CoreStart,
    plugins: ElasticAssistantPublicPluginStartDeps
  ): ElasticAssistantPublicPluginStart {
    return {};
  }

  public stop() { }
}
