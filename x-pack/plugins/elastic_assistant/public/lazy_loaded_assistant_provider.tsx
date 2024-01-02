/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { FC, Suspense } from 'react';

import { EuiErrorBoundary, EuiSkeletonText } from '@elastic/eui';

const AssistantProviderAppStateLazy = React.lazy(() => import('./assistant/assistant_provider'));

const LazyWrapper: FC = ({ children }) => (
  <EuiErrorBoundary>
    <Suspense fallback={<EuiSkeletonText lines={3} />}>{children}</Suspense>
  </EuiErrorBoundary>
);

/**
 * Lazy-wrapped AssistantProvider React component
 */
export const LazyAssistantProvider = (props) => (
  <LazyWrapper>
    <AssistantProviderAppStateLazy {...props} />
  </LazyWrapper>
);
