/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useState, type FC, useEffect } from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { EuiErrorBoundary } from '@elastic/eui';

import { Router, Routes, Route } from '@kbn/shared-ux-router';
import { ScopedHistory } from '@kbn/core/public';
import { KibanaContextProvider, KibanaThemeProvider } from '@kbn/kibana-react-plugin/public';

import { AssistantProvider, type CodeBlockDetails } from '@kbn/elastic-assistant';
import { SECTION_SLUG } from './common/constants';
import { AppDependencies, useAppDependencies } from './app_dependencies';
import { CloneTransformSection } from './sections/clone_transform';
import { CreateTransformSection } from './sections/create_transform';
import { TransformManagementSection } from './sections/transform_management';
import {
  EnabledFeaturesContextProvider,
  type TransformEnabledFeatures,
} from './serverless_context';

export const App: FC<{ history: ScopedHistory }> = ({ history }) => {
  const [ElasticAssistantProvider, setAssistantProvider] = useState<React.FC>(React.Fragment);
  const [assistantAvailable, setAssistantAvailable] = useState<boolean>(false);

  const { securitySolution } = useAppDependencies();
  useEffect(() => {
    let unmounted = false;
    const getAssistantProvider = async () => {
      const Component = await securitySolution.getAssistantProvider;
      // @TODO: remove
      console.log(`--@@Component`, Component);
      if (!unmounted) {
        setAssistantProvider(Component);
        setAssistantAvailable(true);
      }
    };

    getAssistantProvider();
    return () => {
      unmounted = true;
    };
  }, [securitySolution]);
  // const AssistantProvider = appDependencies.securitySolution.AssistantProvider;
  // @TODO: remove
  console.log(`--@@TransformApp assistantAvailable`, assistantAvailable);

  return (
    <ElasticAssistantProvider>
      <Router history={history}>
        <Routes>
          <Route
            path={`/${SECTION_SLUG.CLONE_TRANSFORM}/:transformId`}
            component={CloneTransformSection}
          />
          <Route
            path={`/${SECTION_SLUG.CREATE_TRANSFORM}/:savedObjectId`}
            component={CreateTransformSection}
          />
          <Route path={`/`}>
            <TransformManagementSection assistantAvailable={assistantAvailable} />
          </Route>
        </Routes>
      </Router>
    </ElasticAssistantProvider>
  );
};

export const renderApp = (
  element: HTMLElement,
  appDependencies: AppDependencies,
  enabledFeatures: TransformEnabledFeatures
) => {
  const I18nContext = appDependencies.i18n.Context;

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity,
        retry: false,
      },
    },
  });

  render(
    <EuiErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <KibanaThemeProvider theme$={appDependencies.theme.theme$}>
          <KibanaContextProvider services={appDependencies}>
            <I18nContext>
              <EnabledFeaturesContextProvider enabledFeatures={enabledFeatures}>
                <App history={appDependencies.history} />
              </EnabledFeaturesContextProvider>
            </I18nContext>
          </KibanaContextProvider>
        </KibanaThemeProvider>
      </QueryClientProvider>
    </EuiErrorBoundary>,
    element
  );

  return () => {
    unmountComponentAtNode(element);
  };
};
