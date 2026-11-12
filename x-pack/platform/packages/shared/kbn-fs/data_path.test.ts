/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { join } from 'path';
import { getDataPath } from '@kbn/utils';
import {
  clearKibanaDataPath,
  getKibanaDataPath,
  isInsideDirectory,
  setKibanaDataPath,
} from './data_path';

describe('kibana data path', () => {
  afterEach(() => {
    clearKibanaDataPath();
  });

  it('uses a configured path.data directory', () => {
    setKibanaDataPath('/var/lib/kibana');

    expect(getKibanaDataPath()).toBe('/var/lib/kibana');
  });

  it('resolves a relative path.data against the current working directory', () => {
    setKibanaDataPath('custom-data');

    expect(getKibanaDataPath()).toBe(join(process.cwd(), 'custom-data'));
  });

  it('rejects an empty path.data value', () => {
    expect(() => setKibanaDataPath('')).toThrow('Kibana data path must be a non-empty string');
  });

  it('allows setting the same path twice', () => {
    setKibanaDataPath('/var/lib/kibana');

    expect(() => setKibanaDataPath('/var/lib/kibana/')).not.toThrow();
  });

  it('refuses to change an already configured path', () => {
    setKibanaDataPath('/var/lib/kibana');

    expect(() => setKibanaDataPath('/somewhere/else')).toThrow('already set');
    expect(getKibanaDataPath()).toBe('/var/lib/kibana');
  });

  it('defaults to the same directory as the path.data setting', () => {
    expect(getKibanaDataPath()).toBe(getDataPath());
  });

  describe('isInsideDirectory', () => {
    it('accepts the directory itself and nested paths', () => {
      expect(isInsideDirectory('/data', '/data')).toBe(true);
      expect(isInsideDirectory('/data/a/b.txt', '/data')).toBe(true);
      expect(isInsideDirectory('/data/a', '/data/')).toBe(true);
    });

    it('rejects siblings sharing a prefix and parent paths', () => {
      expect(isInsideDirectory('/data-evil/x', '/data')).toBe(false);
      expect(isInsideDirectory('/data/../etc', '/data')).toBe(false);
      expect(isInsideDirectory('/', '/data')).toBe(false);
    });
  });
});
