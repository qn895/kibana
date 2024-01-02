/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useKibana } from './kibana';
import { ElasticAssistantPublicPluginStartDeps } from './types';

export const useBasePath = (): string => useKibana().services.http.basePath.get();

export const useIsExperimentalFeatureEnabled = (arg: string) => true;

export const useToasts = (): ElasticAssistantPublicPluginStartDeps['notifications']['toasts'] =>
  useKibana().services.notifications.toasts;
