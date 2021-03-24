/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React from 'react';
import moment from 'moment';
import { i18n } from '@kbn/i18n';
import { takeUntil } from 'rxjs/operators';
import { from } from 'rxjs';
import type { CoreStart, OverlayRef } from 'kibana/public';
import {
  JobSelectorFlyoutContent,
  SelectionPayload,
} from '../../application/components/job_selector/job_selector_flyout';
import { getInitialGroupsMap } from '../../application/components/job_selector/job_selector';
import {
  toMountPoint,
  KibanaContextProvider,
} from '../../../../../../src/plugins/kibana_react/public';
import { getMlGlobalServices } from '../../application/app';
import { DashboardConstants } from '../../../../../../src/plugins/dashboard/public';
import type { AnomalyChartsEmbeddableInput, AnomalySwimlaneEmbeddableInput } from '../types';

export interface SelectionConfirmationPayload<
  T extends AnomalySwimlaneEmbeddableInput | AnomalyChartsEmbeddableInput
> {
  flyoutSession: OverlayRef;
  onCreate: (value: Partial<T> | PromiseLike<Partial<T>>) => void;
  onCancel: (reason?: any) => void;
  payload: SelectionPayload;
}

export async function resolveEmbeddableUserInput<
  T extends AnomalySwimlaneEmbeddableInput | AnomalyChartsEmbeddableInput
>(
  onSelectionConfirmed: (confirmationPayload: SelectionConfirmationPayload<T>) => void,
  coreStart: CoreStart,
  input?: T
): Promise<Partial<T>> {
  const {
    http,
    uiSettings,
    application: { currentAppId$ },
  } = coreStart;

  return new Promise(async (resolve, reject) => {
    const maps = {
      groupsMap: getInitialGroupsMap([]),
      jobsMap: {},
    };

    const tzConfig = uiSettings.get('dateFormat:tz');
    const dateFormatTz = tzConfig !== 'Browser' ? tzConfig : moment.tz.guess();

    const selectedIds = input?.jobIds;

    const flyoutSession = coreStart.overlays.openFlyout(
      toMountPoint(
        <KibanaContextProvider services={{ ...coreStart, mlServices: getMlGlobalServices(http) }}>
          <JobSelectorFlyoutContent
            selectedIds={selectedIds}
            withTimeRangeSelector={false}
            dateFormatTz={dateFormatTz}
            singleSelection={false}
            timeseriesOnly={true}
            onFlyoutClose={() => {
              flyoutSession.close();
              reject();
            }}
            onSelectionConfirmed={(payload) =>
              onSelectionConfirmed({
                flyoutSession,
                onCreate: resolve,
                onCancel: reject,
                payload,
              })
            }
            maps={maps}
          />
        </KibanaContextProvider>
      ),
      {
        'data-test-subj': 'mlFlyoutJobSelector',
        ownFocus: true,
        closeButtonAriaLabel: i18n.translate(
          'xpack.ml.mlEmbeddable.setupFlyout.closeJobSelectionDialogAriaLabel',
          {
            defaultMessage: 'Close job selection dialog',
          }
        ),
      }
    );

    // Close the flyout when user navigates out of the dashboard plugin
    currentAppId$.pipe(takeUntil(from(flyoutSession.onClose))).subscribe((appId) => {
      if (appId !== DashboardConstants.DASHBOARDS_ID) {
        flyoutSession.close();
      }
    });
  });
}
