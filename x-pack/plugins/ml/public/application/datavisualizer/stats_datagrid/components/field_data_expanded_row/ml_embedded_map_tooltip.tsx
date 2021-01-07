/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { useEffect } from 'react';
import {
  EuiDescriptionList,
  EuiDescriptionListDescription,
  EuiDescriptionListTitle,
  EuiOutsideClickDetector,
  EuiPopoverTitle,
} from '@elastic/eui';
import { RenderTooltipContentParams } from '../../../../../../../maps/public';

type MapToolTipProps = Partial<RenderTooltipContentParams>;

function MapToolTipComponent({
  closeTooltip,
  features = [],
  loadFeatureProperties,
}: MapToolTipProps) {
  const { id: featureId, layerId } = features[0] ?? {};

  useEffect(() => {
    const loadRegionInfo = async () => {
      if (loadFeatureProperties) {
        const items = await loadFeatureProperties({ layerId, featureId });
        // console.log('layerId, featureId', layerId, featureId);
        //
        items.forEach((item) => {
          // if (item.getPropertyKey() === COUNTRY_NAME || item.getPropertyKey() === REGION_NAME) {
          //   setRegionName(item.getRawValue() as string);
          // }
          // if (
          //   item.getPropertyKey() === TRANSACTION_DURATION_REGION ||
          //   item.getPropertyKey() === TRANSACTION_DURATION_COUNTRY
          // ) {
          //   setPageLoadDuration(formatPageLoadValue(+(item.getRawValue() as string)));
          // }
        });
      }
    };
    loadRegionInfo();
  });

  return (
    <EuiOutsideClickDetector
      onOutsideClick={() => {
        if (closeTooltip != null) {
          closeTooltip();
        }
      }}
    >
      <>
        <EuiPopoverTitle>Test</EuiPopoverTitle>
        <EuiDescriptionList
          type="column"
          textStyle="reverse"
          compressed={true}
          style={{ width: 300 }}
        >
          <EuiDescriptionListTitle>description title</EuiDescriptionListTitle>
          <EuiDescriptionListDescription>description</EuiDescriptionListDescription>
        </EuiDescriptionList>
      </>
    </EuiOutsideClickDetector>
  );
}

export const MapToolTip = React.memo(MapToolTipComponent);
