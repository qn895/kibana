/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { elasticsearchServiceMock } from '@kbn/core/server/mocks';
import { defaultInferenceEndpoints } from '@kbn/inference-common';
import { isElserInEisAvailable } from './is_elser_in_eis_available';

describe('isElserInEisAvailable', () => {
  it('returns true when .elser-2-elastic is present', async () => {
    const esClient = elasticsearchServiceMock.createElasticsearchClient();
    esClient.inference.get.mockResolvedValue({
      endpoints: [{ inference_id: defaultInferenceEndpoints.ELSER_IN_EIS_INFERENCE_ID }],
    } as Awaited<ReturnType<typeof esClient.inference.get>>);

    await expect(isElserInEisAvailable(esClient)).resolves.toBe(true);
    expect(esClient.inference.get).toHaveBeenCalledWith({
      inference_id: defaultInferenceEndpoints.ELSER_IN_EIS_INFERENCE_ID,
    });
  });

  it('returns false when the endpoint list is empty', async () => {
    const esClient = elasticsearchServiceMock.createElasticsearchClient();
    esClient.inference.get.mockResolvedValue({
      endpoints: [],
    } as Awaited<ReturnType<typeof esClient.inference.get>>);

    await expect(isElserInEisAvailable(esClient)).resolves.toBe(false);
  });

  it('returns false when the lookup fails (endpoint missing)', async () => {
    const esClient = elasticsearchServiceMock.createElasticsearchClient();
    esClient.inference.get.mockRejectedValue(new Error('not found'));

    await expect(isElserInEisAvailable(esClient)).resolves.toBe(false);
  });
});
