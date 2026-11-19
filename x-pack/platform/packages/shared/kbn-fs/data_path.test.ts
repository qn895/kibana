/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { resolve } from 'path';
import { getDataPath } from '@kbn/utils';
import { isInsideDirectory, resolveFsDataPath } from './data_path';

describe('data path', () => {
  describe('resolveFsDataPath', () => {
    it('uses the same default as Kibana path.data when no directory is passed', () => {
      expect(resolveFsDataPath()).toBe(resolve(getDataPath()));
    });

    it('uses an explicit absolute directory', () => {
      expect(resolveFsDataPath('/var/lib/kibana')).toBe('/var/lib/kibana');
      expect(resolveFsDataPath('/var/lib/kibana/')).toBe('/var/lib/kibana');
    });

    it('resolves a relative directory from the current working directory', () => {
      expect(resolveFsDataPath('relative/data')).toBe(resolve('relative/data'));
    });

    it('rejects an empty path', () => {
      expect(() => resolveFsDataPath('   ')).toThrow('Kibana data path must be a non-empty string');
    });

    it('rejects the filesystem root', () => {
      expect(() => resolveFsDataPath('/')).toThrow(
        'Kibana data path must not be the filesystem root'
      );
    });
  });

  describe('isInsideDirectory', () => {
    it('accepts the directory and its children, and rejects a sibling prefix', () => {
      expect(isInsideDirectory('/var/lib/kibana', '/var/lib/kibana')).toBe(true);
      expect(isInsideDirectory('/var/lib/kibana', '/var/lib/kibana/ai-kb-artifacts/a.zip')).toBe(
        true
      );
      expect(isInsideDirectory('/var/lib/kibana', '/var/lib/kibana-other/a.zip')).toBe(false);
      expect(isInsideDirectory('/var/lib/kibana', '/etc/passwd')).toBe(false);
    });
  });
});
