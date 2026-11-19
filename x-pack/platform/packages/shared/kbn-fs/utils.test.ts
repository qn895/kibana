/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { join } from 'path';
import { resolveFsDataPath } from './data_path';
import { getSafePath } from './utils';

const DATA_PATH = resolveFsDataPath();

describe('kbn-fs utils', () => {
  describe('getSafePath', () => {
    it('should create safe path without volume', () => {
      const result = getSafePath('test-file.txt');

      expect(result.fullPath).toBe(join(DATA_PATH, 'test-file.txt'));
      expect(result.alias).toBe('disk:data/test-file.txt');
    });

    it('should create safe path without volume with subfolder', () => {
      const result = getSafePath('test/test-file.txt');

      expect(result.fullPath).toBe(join(DATA_PATH, 'test/test-file.txt'));
      expect(result.alias).toBe('disk:data/test/test-file.txt');
    });

    it('should create safe path with volume', () => {
      const result = getSafePath('test-file.txt', 'reports');

      expect(result.fullPath).toBe(join(DATA_PATH, 'reports', 'test-file.txt'));
      expect(result.alias).toBe('disk:data/reports/test-file.txt');
    });

    it('should resolve absolute path', () => {
      const result = getSafePath('test.txt');

      expect(result.fullPath).toBe(join(DATA_PATH, 'test.txt'));
      expect(result.fullPath).not.toContain('..');
    });

    it('should resolve under the data directory passed by the caller', () => {
      const result = getSafePath('ai-kb-artifacts/artifact.zip', undefined, '/var/lib/kibana');

      expect(result.fullPath).toBe('/var/lib/kibana/ai-kb-artifacts/artifact.zip');
      expect(() => getSafePath('../../../etc/passwd', undefined, '/var/lib/kibana')).toThrow(
        /Path traversal detected/
      );
      expect(getSafePath('test.txt').fullPath).toBe(join(DATA_PATH, 'test.txt'));
    });

    it('should reject the filesystem root as a data directory', () => {
      expect(() => getSafePath('test.txt', undefined, '/')).toThrow(
        'Kibana data path must not be the filesystem root'
      );
    });

    it('should throw error for path traversal attempts', () => {
      expect(() => getSafePath('../../../etc/passwd')).toThrow();
      expect(() => getSafePath('file/../../other.txt')).toThrow();
    });

    it('should handle nested volume paths', () => {
      const result = getSafePath('file.txt', 'reports/2024/january');

      expect(result.fullPath).toBe(join(DATA_PATH, 'reports', '2024', 'january', 'file.txt'));
      expect(result.alias).toBe('disk:data/reports/2024/january/file.txt');
    });

    it('should handle empty volume', () => {
      const result = getSafePath('test.txt', '');

      expect(result.fullPath).toBe(join(DATA_PATH, 'test.txt'));
      expect(result.alias).toBe('disk:data/test.txt');
    });

    it('should handle undefined volume', () => {
      const result = getSafePath('test.txt', undefined);

      expect(result.fullPath).toBe(join(DATA_PATH, 'test.txt'));
      expect(result.alias).toBe('disk:data/test.txt');
    });
  });
});
