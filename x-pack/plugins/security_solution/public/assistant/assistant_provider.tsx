/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
// import { KibanaContextProvider } from '@kbn/kibana-react-plugin/public';
import { Provider as ReduxStoreProvider } from 'react-redux';
// import { APP_NAME } from '../../common/constants';
import { AssistantProvider } from './provider';

export const ElasticAssistantProvider = ({ store, services, children }) => {
  return (
    <ReduxStoreProvider store={store}>
      <AssistantProvider>{children}</AssistantProvider>
    </ReduxStoreProvider>
  );
};
// eslint-disable-next-line import/no-default-export
export default ElasticAssistantProvider;
