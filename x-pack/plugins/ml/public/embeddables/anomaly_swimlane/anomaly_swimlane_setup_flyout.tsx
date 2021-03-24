/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { CoreStart } from 'kibana/public';
import { VIEW_BY_JOB_LABEL } from '../../application/explorer/explorer_constants';
import { toMountPoint } from '../../../../../../src/plugins/kibana_react/public';
import { AnomalySwimlaneInitializer } from './anomaly_swimlane_initializer';
import { AnomalyDetectorService } from '../../application/services/anomaly_detector_service';
import { getDefaultSwimlanePanelTitle } from './anomaly_swimlane_embeddable';
import { HttpService } from '../../application/services/http_service';
import { AnomalySwimlaneEmbeddableInput } from '..';
import {
  resolveEmbeddableUserInput,
  SelectionConfirmationPayload,
} from '../common/resolve_user_input';

export async function resolveAnomalySwimlaneUserInput(
  coreStart: CoreStart,
  input?: AnomalySwimlaneEmbeddableInput
): Promise<Partial<AnomalySwimlaneEmbeddableInput>> {
  const { http, overlays } = coreStart;

  const anomalyDetectorService = new AnomalyDetectorService(new HttpService(http));

  const onSelectionConfirmed = async ({
    flyoutSession,
    onCreate,
    onCancel,
    payload,
  }: SelectionConfirmationPayload<AnomalySwimlaneEmbeddableInput>) => {
    const { jobIds } = payload;
    const title = input?.title ?? getDefaultSwimlanePanelTitle(jobIds);

    const jobs = await anomalyDetectorService.getJobs$(jobIds).toPromise();

    const influencers = anomalyDetectorService.extractInfluencers(jobs);
    influencers.push(VIEW_BY_JOB_LABEL);

    await flyoutSession.close();

    const modalSession = overlays.openModal(
      toMountPoint(
        <AnomalySwimlaneInitializer
          defaultTitle={title}
          influencers={influencers}
          initialInput={input}
          onCreate={({ panelTitle, viewBy, swimlaneType }) => {
            modalSession.close();
            onCreate({ jobIds, title: panelTitle, swimlaneType, viewBy });
          }}
          onCancel={() => {
            modalSession.close();
            onCancel();
          }}
        />
      )
    );
  };

  return resolveEmbeddableUserInput<AnomalySwimlaneEmbeddableInput>(
    onSelectionConfirmed,
    coreStart,
    input
  );
}
