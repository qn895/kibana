/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { isEmpty, isError } from 'lodash';
import { schema } from '@kbn/config-schema';
import { Logger, LogMeta } from '@kbn/logging';
import { AlertExecutionDetails } from '../../../../common/alerting/metrics/types';

export const oneOfLiterals = (arrayOfLiterals: Readonly<string[]>) =>
  schema.string({
    validate: (value) =>
      arrayOfLiterals.includes(value) ? undefined : `must be one of ${arrayOfLiterals.join(' | ')}`,
  });

export const validateIsStringElasticsearchJSONFilter = (value: string) => {
  if (value === '') {
    // Allow clearing the filter.
    return;
  }

  const errorMessage = 'filterQuery must be a valid Elasticsearch filter expressed in JSON';
  try {
    const parsedValue = JSON.parse(value);
    if (!isEmpty(parsedValue.bool)) {
      return undefined;
    }
    return errorMessage;
  } catch (e) {
    return errorMessage;
  }
};

export const UNGROUPED_FACTORY_KEY = '*';

export const createScopedLogger = (
  logger: Logger,
  scope: string,
  alertExecutionDetails: AlertExecutionDetails
): Logger => {
  const scopedLogger = logger.get(scope);
  const fmtMsg = (msg: string) =>
    `[AlertId: ${alertExecutionDetails.alertId}][ExecutionId: ${alertExecutionDetails.executionId}] ${msg}`;
  return {
    ...scopedLogger,
    info: <Meta extends LogMeta = LogMeta>(msg: string, meta?: Meta) =>
      scopedLogger.info(fmtMsg(msg), meta),
    debug: <Meta extends LogMeta = LogMeta>(msg: string, meta?: Meta) =>
      scopedLogger.debug(fmtMsg(msg), meta),
    trace: <Meta extends LogMeta = LogMeta>(msg: string, meta?: Meta) =>
      scopedLogger.trace(fmtMsg(msg), meta),
    warn: <Meta extends LogMeta = LogMeta>(errorOrMessage: string | Error, meta?: Meta) => {
      if (isError(errorOrMessage)) {
        scopedLogger.warn(errorOrMessage, meta);
      } else {
        scopedLogger.warn(fmtMsg(errorOrMessage), meta);
      }
    },
    error: <Meta extends LogMeta = LogMeta>(errorOrMessage: string | Error, meta?: Meta) => {
      if (isError(errorOrMessage)) {
        scopedLogger.error(errorOrMessage, meta);
      } else {
        scopedLogger.error(fmtMsg(errorOrMessage), meta);
      }
    },
    fatal: <Meta extends LogMeta = LogMeta>(errorOrMessage: string | Error, meta?: Meta) => {
      if (isError(errorOrMessage)) {
        scopedLogger.fatal(errorOrMessage, meta);
      } else {
        scopedLogger.fatal(fmtMsg(errorOrMessage), meta);
      }
    },
  };
};
