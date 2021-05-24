/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { FC, useEffect, useState } from 'react';
import { i18n } from '@kbn/i18n';
import { EuiButtonEmpty, EuiFlexGroup, EuiFlexItem, EuiSpacer } from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n/react';
import cytoscape from 'cytoscape';
import { EuiThemeType, useCurrentEuiTheme } from '../color_range_legend';
import { useFetchAnalyticsMapData } from '../../data_frame_analytics/pages/job_map/use_fetch_analytics_map_data';
import { useMlKibana, useMlUrlGenerator } from '../../contexts/kibana';
import { JOB_MAP_NODE_TYPES } from '../../../../common/constants/data_frame_analytics';
import { useRefDimensions } from '../../data_frame_analytics/pages/job_map/components/use_ref_dimensions';
import { Cytoscape } from '../../data_frame_analytics/pages/job_map/components';
import { JobId } from '../../../../common/types/anomaly_detection_jobs';
import {
  MapShapes,
  MAP_SHAPES,
} from '../../data_frame_analytics/pages/job_map/components/cytoscape_options';
import { ANOMALY_THRESHOLD } from '../../../../common';
// @ts-ignore no declaration file

const getCytoscapeDivStyle = (theme: EuiThemeType) => ({
  background: `linear-gradient(
  90deg,
  ${theme.euiPageBackgroundColor}
    calc(${theme.euiSizeL} - calc(${theme.euiSizeXS} / 2)),
  transparent 1%
)
center,
linear-gradient(
  ${theme.euiPageBackgroundColor}
    calc(${theme.euiSizeL} - calc(${theme.euiSizeXS} / 2)),
  transparent 1%
)
center,
${theme.euiColorLightShade}`,
  backgroundSize: `${theme.euiSizeL} ${theme.euiSizeL}`,
  margin: `-${theme.gutterTypes.gutterLarge}`,
  marginTop: 0,
});

interface TableAnomaly {
  influencers: Influencer[];
  severity: number;
  time: number;
  detector: string;
  detectorIndex: number;
  rowId: string;
}
interface Influencer {
  [key: string]: string;
}
interface Props {
  bounds: any;
  tableData: {
    anomalies: TableAnomaly[];
    examplesByJobId: any;
    interval: string;
    jobIds: JobId[];
    showViewSeriesLink: boolean;
  };
}

function shapeForNode(el: cytoscape.NodeSingular, theme: EuiThemeType): MapShapes {
  const type = el.data('type');
  switch (type) {
    case 'region':
      return MAP_SHAPES.RECTANGLE;
    case 'instance':
      return MAP_SHAPES.DIAMOND;
  }
}

function borderColorForNode(el: cytoscape.NodeSingular, theme: EuiThemeType) {
  if (el.selected()) {
    return theme.euiColorPrimary;
  }

  const type = el.data('type');

  switch (type) {
    case 'region':
      return theme.euiColorSecondary;
    case 'instance':
      return theme.euiColorVis1;
    case '1':
      return theme.euiColorSecondary;
    case '2':
      return theme.euiColorVis1;
    case '3':
      return theme.euiColorVis2;
    case '4':
      return theme.euiColorVis3;
    default:
      return theme.euiColorMediumShade;
  }
}

export const FREQUENCY_COLOR = {
  CRITICAL: '#fe5050',
  MAJOR: '#fba740',
  MINOR: '#fdec25',
  WARNING: '#e3fb8b',
  LOW: '#dcffc1',
  BLANK: '#ecffeb',
};

// Returns a severity RGB color (one of critical, major, minor, warning, low_warning or unknown)
// for the supplied normalized anomaly score (a value between 0 and 100).
export function getFrequencyColor(normalizedScore: number): string {
  if (normalizedScore >= ANOMALY_THRESHOLD.CRITICAL) {
    return FREQUENCY_COLOR.CRITICAL;
  } else if (normalizedScore >= ANOMALY_THRESHOLD.MAJOR) {
    return FREQUENCY_COLOR.MAJOR;
  } else if (normalizedScore >= ANOMALY_THRESHOLD.MINOR) {
    return FREQUENCY_COLOR.MINOR;
  } else if (normalizedScore >= ANOMALY_THRESHOLD.WARNING) {
    return FREQUENCY_COLOR.WARNING;
  } else if (normalizedScore >= ANOMALY_THRESHOLD.LOW) {
    return FREQUENCY_COLOR.LOW;
  } else {
    return FREQUENCY_COLOR.BLANK;
  }
}

export const AnomaliesVisualizer: FC<Props> = ({ bounds, tableData }) => {
  // itemsDeleted will reset to false when Controls component calls updateElements to remove nodes deleted from map
  const [itemsDeleted, setItemsDeleted] = useState<boolean>(false);
  const [resetCyToggle, setResetCyToggle] = useState<boolean>(false);
  const [elements, setElements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState();

  const {
    services: { notifications },
  } = useMlKibana();
  const { euiTheme } = useCurrentEuiTheme();

  const getNodeId = (influencer: Influencer) => {
    if (!influencer) return;
    const influencerName = Object.keys(influencer)[0];
    const influencerValue = Object.values(influencer)[0];
    return `node-${influencerName}-${influencerValue}`;
  };

  const getElements = (anomalies) => {
    if (!anomalies || anomalies.length < 1) return;
    setIsLoading(true);
    const tempNodes = [];
    const tempEdges = [];

    const frequencyCounter: { [id: string]: number } = {};
    const uniqueIds = new Set();

    anomalies.forEach((anomaly) => {
      if (!anomaly.influencers) return;
      for (let i = 0; i < anomaly.influencers.length; i++) {
        const influencer = anomaly.influencers[i];
        const influencerName = Object.keys(influencer)[0];
        const influencerValue = Object.values(influencer)[0];
        const id = `${influencerName}-${influencerValue}`;
        const nodeId = `node-${id}`;

        if (uniqueIds.has(nodeId)) {
          frequencyCounter[nodeId] += 1;
        } else {
          uniqueIds.add(nodeId);
          frequencyCounter[nodeId] = 1;

          tempNodes.push({
            data: { id: nodeId, label: id, type: influencerName, label: influencerValue },
          });
        }

        const nextNodeId = getNodeId(anomaly.influencers[i + 1]);
        if (nextNodeId !== undefined) {
          tempEdges.push({
            // edge ab
            data: {
              id: `edge-${nodeId}-${nextNodeId}`,
              source: nodeId,
              target: nextNodeId,
              isRoot: i === 0 ? true : false,
              group: 'edges',
            },
          });
        }
      }
    });

    const sumFrequency = Object.values(frequencyCounter).reduce(
      (runningSum, val) => runningSum + val,
      0
    );
    // assign color to node based on frequency of anomaly happening
    const enhancedNodes = tempNodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        frequency: (frequencyCounter[node.data.id] / sumFrequency) * 100,
        group: 'nodes',
      },
    }));
    setItemsDeleted(true);
    setElements([...enhancedNodes, ...tempEdges]);
    setIsLoading(false);
  };

  useEffect(() => {
    getElements(tableData.anomalies);
  }, [tableData.anomalies, bounds]);

  if (error !== undefined) {
    notifications.toasts.addDanger(
      i18n.translate('xpack.ml.dataframe.analyticsMap.fetchDataErrorMessage', {
        defaultMessage: 'Unable to fetch some data. An error occurred: {error}',
        values: { error: JSON.stringify(error) },
      })
    );
    setError(undefined);
  }

  const { ref, width } = useRefDimensions();

  const refreshCallback = () => {
    getElements(tableData.anomalies);
  };

  return Array.isArray(elements) && elements.length > 0 ? (
    <div data-test-subj="mlPageDataFrameAnalyticsMap" style={{ minHeight: 600 }}>
      <EuiSpacer size="m" />
      <EuiFlexGroup direction="column" gutterSize="none" justifyContent="spaceBetween">
        <EuiFlexItem grow={false}>
          <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
            <EuiFlexItem grow={false}>
              <div />
              {/* <JobMapLegend theme={euiTheme} />*/}
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiFlexGroup gutterSize="xs" component="span">
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                size="xs"
                data-test-subj={`mlAnalyticsRefreshMapButton${isLoading ? ' loading' : ' loaded'}`}
                onClick={refreshCallback}
                isLoading={isLoading}
              >
                <FormattedMessage
                  id="xpack.ml.dataframe.analyticsList.refreshMapButtonLabel"
                  defaultMessage="Refresh"
                />
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                size="xs"
                data-test-subj="mlAnalyticsResetGraphButton"
                // trigger reset on value change
                onClick={() => setResetCyToggle(!resetCyToggle)}
              >
                <FormattedMessage
                  id="xpack.ml.dataframe.analyticsList.resetMapButtonLabel"
                  defaultMessage="Reset"
                />
              </EuiButtonEmpty>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
      <div style={{ height: 600 }} ref={ref}>
        <Cytoscape
          option={{
            autoungrabify: true,
            boxSelectionEnabled: false,
            maxZoom: 3,
            minZoom: 0.2,
            layout: {
              name: 'spread',
            },
            style: [
              {
                selector: 'node',
                style: {
                  'background-color': (el: cytoscape.NodeSingular) => {
                    const frequency = el.data('frequency');
                    if (frequency) {
                      const color = getFrequencyColor(frequency);
                      return color;
                    }
                    return euiTheme.euiColorGhost;
                  },
                  'background-height': '60%',
                  'background-width': '60%',
                  'border-color': (el: cytoscape.NodeSingular) => borderColorForNode(el, euiTheme),
                  'border-style': 'solid',
                  'border-width': (el: cytoscape.NodeSingular) => (el.selected() ? 4 : 3),
                  // @ts-ignore
                  color: euiTheme.euiTextColors.default,
                  'font-family': 'Inter UI, Segoe UI, Helvetica, Arial, sans-serif',
                  'font-size': euiTheme.euiFontSizeXS,
                  'min-zoomed-font-size': parseInt(euiTheme.euiSizeL, 10),
                  label: 'data(label)',
                  shape: (el: cytoscape.NodeSingular) => shapeForNode(el, euiTheme),
                  'text-background-color': euiTheme.euiColorLightestShade,
                  'text-background-opacity': 0,
                  'text-background-padding': euiTheme.paddingSizes.xs,
                  'text-background-shape': 'roundrectangle',
                  'text-margin-y': parseInt(euiTheme.paddingSizes.s, 10),
                  'text-max-width': '250px',
                  'text-valign': 'top',
                  'text-halign': 'left',
                  'text-wrap': 'wrap',
                },
              },
            ],
          }}
          theme={euiTheme}
          height={600}
          elements={elements}
          width={width}
          style={getCytoscapeDivStyle(euiTheme)}
          itemsDeleted={itemsDeleted}
          resetCy={resetCyToggle}
        />
      </div>
    </div>
  ) : (
    <div />
  );
};
