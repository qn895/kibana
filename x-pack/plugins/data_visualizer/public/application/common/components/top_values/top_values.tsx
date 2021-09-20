/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { FC, Fragment } from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiProgress, EuiSpacer, EuiText } from '@elastic/eui';

import { FormattedMessage } from '@kbn/i18n/react';
import { EuiFlexItemProps } from '@elastic/eui/src/components/flex/flex_item';
import classNames from 'classnames';
import { roundToDecimalPlace, kibanaFieldFormat } from '../utils';
import { ExpandedRowFieldHeader } from '../stats_table/components/expanded_row_field_header';
import { FieldVisStats } from '../../../../../common/types';
import { ExpandedRowPanel } from '../stats_table/components/field_data_expanded_row/expanded_row_panel';

interface Props {
  stats: FieldVisStats | undefined;
  fieldFormat?: any;
  barColor?: 'primary' | 'secondary' | 'danger' | 'subdued' | 'accent';
  grow?: EuiFlexItemProps['grow'];
  compressed?: boolean;
}

function getPercentLabel(docCount: number, topValuesSampleSize: number): string {
  const percent = (100 * docCount) / topValuesSampleSize;
  if (percent >= 0.1) {
    return `${roundToDecimalPlace(percent, 1)}%`;
  } else {
    return '< 0.1%';
  }
}

export const TopValues: FC<Props> = ({ stats, fieldFormat, barColor, grow, compressed }) => {
  if (stats === undefined) return null;
  const {
    topValues,
    topValuesSampleSize,
    topValuesSamplerShardSize,
    count,
    isTopValuesSampled,
  } = stats;
  const progressBarMax = isTopValuesSampled === true ? topValuesSampleSize : count;
  return (
    <ExpandedRowPanel
      grow={grow}
      dataTestSubj={'dataVisualizerFieldDataTopValues'}
      className={classNames('dataVisualizerPanelWrapper', compressed ? 'compressed' : undefined)}
    >
      <ExpandedRowFieldHeader>
        <FormattedMessage
          id="xpack.dataVisualizer.dataGrid.field.topValuesLabel"
          defaultMessage="Top values"
        />
      </ExpandedRowFieldHeader>

      <div
        data-test-subj="dataVisualizerFieldDataTopValuesContent"
        className={classNames('fieldDataTopValuesContainer', 'dataVisualizerTopValuesWrapper')}
      >
        {Array.isArray(topValues) &&
          topValues.map((value) => (
            <EuiFlexGroup gutterSize="xs" alignItems="center" key={value.key}>
              <EuiFlexItem data-test-subj="dataVisualizerFieldDataTopValueBar">
                <EuiProgress
                  value={value.doc_count}
                  max={progressBarMax}
                  color={barColor}
                  size="xs"
                  valueText={
                    progressBarMax !== undefined
                      ? getPercentLabel(value.doc_count, progressBarMax)
                      : undefined
                  }
                  label={kibanaFieldFormat(value.key, fieldFormat)}
                  className={classNames('eui-textTruncate', 'topValuesValueLabelContainer')}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          ))}
        {isTopValuesSampled === true && (
          <Fragment>
            <EuiSpacer size="xs" />
            <EuiText size="xs" textAlign={'center'}>
              <FormattedMessage
                id="xpack.dataVisualizer.dataGrid.field.topValues.calculatedFromSampleDescription"
                defaultMessage="Calculated from sample of {topValuesSamplerShardSize} documents per shard"
                values={{
                  topValuesSamplerShardSize,
                }}
              />
            </EuiText>
          </Fragment>
        )}
      </div>
    </ExpandedRowPanel>
  );
};
