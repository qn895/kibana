/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { QueryDslQueryContainer } from '@elastic/elasticsearch/lib/api/types';
import type { IScopedClusterClient } from '@kbn/core-elasticsearch-server';
import type { Logger } from '@kbn/core/server';
import type {
  ObservabilityAgentBuilderCoreSetup,
  ObservabilityAgentBuilderPluginSetupDependencies,
} from '../../types';
import { getObservabilityDataSources } from '../../utils/get_observability_data_sources';
import { kqlFilter, timeRangeFilter } from '../../utils/dsl_filters';
import { parseDatemath } from '../../utils/time';

type CorrelationsMetric = 'latency' | 'failure_rate';

const DEFAULT_FIELD_CANDIDATES = [
  'service.name',
  'service.environment',
  'host.name',
  'cloud.region',
  'kubernetes.namespace',
  'kubernetes.pod.name',
  'container.id',
  'agent.name',
  'user_agent.name',
] as const;

const APM_TIME_FIELD = '@timestamp';
const TRANSACTION_DURATION_US_FIELD = 'transaction.duration.us';
const EVENT_OUTCOME_FIELD = 'event.outcome';
const PROCESSOR_EVENT_FIELD = 'processor.event';
const PROCESSOR_EVENT_TRANSACTION = 'transaction';

function getOverallFilters({
  start,
  end,
  kqlFilter: kqlFilterValue,
}: {
  start: number;
  end: number;
  kqlFilter?: string;
}): QueryDslQueryContainer[] {
  return [
    ...timeRangeFilter(APM_TIME_FIELD, { start, end }),
    ...kqlFilter(kqlFilterValue),
    { term: { [PROCESSOR_EVENT_FIELD]: PROCESSOR_EVENT_TRANSACTION } },
  ];
}

function toBoolFilter(filters: QueryDslQueryContainer[]) {
  return { bool: { filter: filters } };
}

function roundTo(value: number, digits: number) {
  const factor = Math.pow(10, digits);
  return Math.round(value * factor) / factor;
}

export async function getToolHandler({
  core,
  plugins,
  logger,
  esClient,
  start,
  end,
  kqlFilter: kqlFilterValue,
  metric,
  percentileThreshold,
  fieldCandidates,
  limit,
}: {
  core: ObservabilityAgentBuilderCoreSetup;
  plugins: ObservabilityAgentBuilderPluginSetupDependencies;
  logger: Logger;
  esClient: IScopedClusterClient;
  start: string;
  end: string;
  kqlFilter?: string;
  metric: CorrelationsMetric;
  percentileThreshold: number;
  fieldCandidates?: string[];
  limit: number;
}) {
  const dataSources = await getObservabilityDataSources({ core, plugins, logger });
  const indices = dataSources.apmIndexPatterns.transaction.split(',');

  const startTime = parseDatemath(start);
  const endTime = parseDatemath(end, { roundUp: true });

  const overallFilters = getOverallFilters({
    start: startTime,
    end: endTime,
    kqlFilter: kqlFilterValue,
  });

  const overallCountResp = await esClient.asCurrentUser.search({
    index: indices,
    size: 0,
    track_total_hits: true,
    query: toBoolFilter(overallFilters),
  });

  const overallTotalHits =
    typeof overallCountResp.hits.total === 'number'
      ? overallCountResp.hits.total
      : overallCountResp.hits.total?.value ?? 0;

  if (overallTotalHits === 0) {
    return {
      metric,
      timeRange: { start, end },
      kqlFilter: kqlFilterValue,
      totalTransactions: 0,
      subset: {
        totalTransactions: 0,
        definition:
          metric === 'latency'
            ? { metric: 'latency', percentileThreshold, durationThresholdUs: undefined }
            : { metric: 'failure_rate' },
      },
      correlations: [],
    };
  }

  let subsetFilters: QueryDslQueryContainer[] = [];
  let subsetDefinition:
    | { metric: 'latency'; percentileThreshold: number; durationThresholdUs: number }
    | { metric: 'failure_rate' };

  if (metric === 'latency') {
    const percentileKey = `${percentileThreshold}`;
    const percentileResp = await esClient.asCurrentUser.search({
      index: indices,
      size: 0,
      query: toBoolFilter(overallFilters),
      aggs: {
        duration_percentile: {
          percentiles: {
            field: TRANSACTION_DURATION_US_FIELD,
            percents: [percentileThreshold],
            keyed: true,
          },
        },
      },
    });

    const durationPercentiles = (
      percentileResp.aggregations?.duration_percentile as
        | { values?: Record<string, number | null> }
        | undefined
    )?.values;
    const durationThresholdUs = durationPercentiles?.[percentileKey];

    if (durationThresholdUs == null || !Number.isFinite(durationThresholdUs)) {
      throw new Error(
        `Could not compute duration percentile (p${percentileThreshold}) for field "${TRANSACTION_DURATION_US_FIELD}".`
      );
    }

    subsetFilters = [
      ...overallFilters,
      {
        range: {
          [TRANSACTION_DURATION_US_FIELD]: { gte: durationThresholdUs },
        },
      },
    ];
    subsetDefinition = { metric: 'latency', percentileThreshold, durationThresholdUs };
  } else {
    subsetFilters = [...overallFilters, { term: { [EVENT_OUTCOME_FIELD]: 'failure' } }];
    subsetDefinition = { metric: 'failure_rate' };
  }

  const subsetCountResp = await esClient.asCurrentUser.search({
    index: indices,
    size: 0,
    track_total_hits: true,
    query: toBoolFilter(subsetFilters),
  });

  const subsetTotalHits =
    typeof subsetCountResp.hits.total === 'number'
      ? subsetCountResp.hits.total
      : subsetCountResp.hits.total?.value ?? 0;

  const candidates = (
    fieldCandidates?.length ? fieldCandidates : [...DEFAULT_FIELD_CANDIDATES]
  ).slice(0, 25);

  const correlations = [];

  for (const field of candidates) {
    const resp = await esClient.asCurrentUser.search({
      index: indices,
      size: 0,
      query: toBoolFilter(subsetFilters),
      aggs: {
        correlated_values: {
          significant_terms: {
            field,
            size: limit,
            background_filter: toBoolFilter(overallFilters),
          },
        },
      },
    });

    const buckets = (resp.aggregations?.correlated_values as any)?.buckets as
      | Array<{ key: string; doc_count: number; bg_count: number; score: number }>
      | undefined;

    if (!buckets || buckets.length === 0) {
      continue;
    }

    const values = buckets.map((b) => {
      const subsetPct = subsetTotalHits ? b.doc_count / subsetTotalHits : 0;
      const overallPct = overallTotalHits ? b.bg_count / overallTotalHits : 0;

      return {
        value: b.key,
        score: roundTo(b.score, 3),
        subsetDocCount: b.doc_count,
        overallDocCount: b.bg_count,
        subsetPct: roundTo(subsetPct, 4),
        overallPct: roundTo(overallPct, 4),
        upliftPctPoints: roundTo((subsetPct - overallPct) * 100, 2),
      };
    });

    correlations.push({ field, values });
  }

  return {
    metric,
    timeRange: { start, end },
    kqlFilter: kqlFilterValue,
    totalTransactions: overallTotalHits,
    subset: {
      totalTransactions: subsetTotalHits,
      definition: subsetDefinition,
    },
    correlations,
  };
}
