/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { resolve } from 'path';
import {
  getFsDataPath,
  isInsideDirectory,
  resetFsDataPath,
  resolveDefaultDataPath,
  setFsDataPath,
} from './data_path';

describe('data path', () => {
  afterEach(() => {
    resetFsDataPath();
  });

  describe('resolveDefaultDataPath', () => {
    const candidates = ['/usr/share/kibana/data', '/var/lib/kibana'];

    it('uses the install data directory when it is readable', () => {
      expect(resolveDefaultDataPath(candidates, (path) => path === candidates[0])).toBe(
        '/usr/share/kibana/data'
      );
    });

    it('uses /var/lib/kibana when the install data directory is not readable', () => {
      expect(resolveDefaultDataPath(candidates, (path) => path === '/var/lib/kibana')).toBe(
        '/var/lib/kibana'
      );
    });

    it('falls back to the install data directory when nothing is readable', () => {
      expect(resolveDefaultDataPath(candidates, () => false)).toBe('/usr/share/kibana/data');
    });
  });

  describe('setFsDataPath', () => {
    it('overrides the directory used for later lookups', () => {
      setFsDataPath('relative/data');

      expect(getFsDataPath()).toBe(resolve('relative/data'));
    });

    it('rejects an empty path', () => {
      expect(() => setFsDataPath('   ')).toThrow('Kibana data path must be a non-empty string');
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
