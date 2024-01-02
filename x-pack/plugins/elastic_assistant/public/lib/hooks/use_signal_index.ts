/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { HttpStart } from '@kbn/core-http-browser';
import { i18n } from '@kbn/i18n';
import { isSecurityAppError } from '@kbn/securitysolution-t-grid';
import { useEffect, useState } from 'react';
import { useKibana } from './kibana';
import { useAppToasts } from './use_app_toasts';

type Func = () => Promise<void>;

export interface ReturnSignalIndex {
  loading: boolean;
  signalIndexExists: boolean | null;
  signalIndexName: string | null;
  signalIndexMappingOutdated: boolean | null;
  createDeSignalIndex: Func | null;
}

export interface BasicSignals {
  signal: AbortSignal;
}

export interface AlertsIndex {
  name: string;
  index_mapping_outdated: boolean;
}

export const DETECTION_ENGINE_URL = '/api/detection_engine' as const;
export const DETECTION_ENGINE_PRIVILEGES_URL = `${DETECTION_ENGINE_URL}/privileges` as const;
export const DETECTION_ENGINE_INDEX_URL = `${DETECTION_ENGINE_URL}/index` as const;

/**
 * Fetch Signal Index
 *
 * @param signal AbortSignal for cancelling request
 *
 * @throws An error if response is not OK
 */
export const getSignalIndex = async (
  http: HttpStart,
  { signal }: BasicSignals
): Promise<AlertsIndex> =>
  http.fetch<AlertsIndex>(DETECTION_ENGINE_INDEX_URL, {
    version: '2023-10-31',
    method: 'GET',
    signal,
  });

/**
 * Create Signal Index if needed it
 *
 * @param signal AbortSignal for cancelling request
 *
 * @throws An error if response is not OK
 */
export const createSignalIndex = async (
  http: HttpStart,
  { signal }: BasicSignals
): Promise<AlertsIndex> =>
  http.fetch<AlertsIndex>(DETECTION_ENGINE_INDEX_URL, {
    version: '2023-10-31',
    method: 'POST',
    signal,
  });

/**
 * Hook for managing signal index
 *
 *
 */
export const useSignalIndex = (): ReturnSignalIndex => {
  const { http } = useKibana().services;

  const [loading, setLoading] = useState(true);
  const [signalIndex, setSignalIndex] = useState<Omit<ReturnSignalIndex, 'loading'>>({
    signalIndexExists: null,
    signalIndexName: null,
    signalIndexMappingOutdated: null,
    createDeSignalIndex: null,
  });
  const { addError } = useAppToasts();
  // @todo
  const hasIndexRead = true;

  useEffect(() => {
    let isSubscribed = true;
    const abortCtrl = new AbortController();

    const fetchData = async () => {
      try {
        setLoading(true);
        const signal = await getSignalIndex(http, { signal: abortCtrl.signal });

        if (isSubscribed && signal != null) {
          setSignalIndex({
            signalIndexExists: true,
            signalIndexName: signal.name,
            signalIndexMappingOutdated: signal.index_mapping_outdated,
            createDeSignalIndex: createIndex,
          });
        }
      } catch (error) {
        if (isSubscribed) {
          setSignalIndex({
            signalIndexExists: false,
            signalIndexName: null,
            signalIndexMappingOutdated: null,
            createDeSignalIndex: createIndex,
          });
          if (isSecurityAppError(error) && error.body.status_code !== 404) {
            addError(error, {
              title: i18n.translate(
                'xpack.securitySolution.containers.detectionEngine.alerts.errorGetAlertDescription',
                {
                  defaultMessage: 'Failed to get signal index name',
                }
              ),
            });
          }
        }
      }
      if (isSubscribed) {
        setLoading(false);
      }
    };

    const createIndex = async () => {
      let isFetchingData = false;
      try {
        setLoading(true);
        await createSignalIndex(http, { signal: abortCtrl.signal });

        if (isSubscribed) {
          isFetchingData = true;
          fetchData();
        }
      } catch (error) {
        if (isSubscribed) {
          if (isSecurityAppError(error) && error.body.status_code === 409) {
            fetchData();
          } else {
            setSignalIndex({
              signalIndexExists: false,
              signalIndexName: null,
              signalIndexMappingOutdated: null,
              createDeSignalIndex: createIndex,
            });
            addError(error, {
              title: i18n.translate(
                'xpack.securitySolution.containers.detectionEngine.alerts.errorPostAlertDescription',
                {
                  defaultMessage: 'Failed to create signal index',
                }
              ),
            });
          }
        }
      }
      if (isSubscribed && !isFetchingData) {
        setLoading(false);
      }
    };

    if (hasIndexRead) {
      fetchData();
    } else {
      // Skip data fetching as the current user doesn't have enough priviliges.
      // Attempt to get the signal index will result in 500 error.
      setLoading(false);
    }
    return () => {
      isSubscribed = false;
      abortCtrl.abort();
    };
  }, [addError, hasIndexRead, http]);

  return { loading, ...signalIndex };
};
