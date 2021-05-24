/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useEffect, useState } from 'react';
import {
  DISCOVER_APP_URL_GENERATOR,
  DiscoverUrlGeneratorState,
} from '../../../../../../../src/plugins/discover/public';
import { useMlKibana } from './kibana_context';

export const useDiscoverLink = (state: DiscoverUrlGeneratorState) => {
  const [discoverLink, setDiscoverLink] = useState('');
  const {
    services: {
      application: { capabilities },
      share: {
        urlGenerators: { getUrlGenerator },
      },
    },
  } = useMlKibana();

  useEffect(() => {
    let unmounted = false;

    const getDiscoverUrl = async (): Promise<void> => {
      const isDiscoverAvailable = capabilities.discover?.show ?? false;
      if (!isDiscoverAvailable) {
        return;
      }

      let discoverUrlGenerator;
      try {
        discoverUrlGenerator = getUrlGenerator(DISCOVER_APP_URL_GENERATOR);
      } catch (error) {
        // ignore error thrown when url generator is not available
        return;
      }

      const discoverUrl = await discoverUrlGenerator.createUrl(state);
      if (!unmounted) {
        setDiscoverLink(discoverUrl);
      }
    };

    getDiscoverUrl();
    return () => {
      unmounted = true;
    };
  }, [state]);

  return discoverLink;
};
