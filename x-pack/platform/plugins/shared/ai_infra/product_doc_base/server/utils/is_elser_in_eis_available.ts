/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { ElasticsearchClient } from '@kbn/core/server';
import { defaultInferenceEndpoints } from '@kbn/inference-common';

/**
 * Returns true when the EIS-hosted ELSER endpoint (`.elser-2-elastic`) exists.
 * Product documentation is auto-updated on plugin start only when this is available.
 */
export const isElserInEisAvailable = async (esClient: ElasticsearchClient): Promise<boolean> => {
  try {
    const result = await esClient.inference.get({
      inference_id: defaultInferenceEndpoints.ELSER_IN_EIS_INFERENCE_ID,
    });
    return Array.isArray(result.endpoints) && result.endpoints.length > 0;
  } catch {
    return false;
  }
};
