/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import * as Fs from 'fs';
import { join } from 'path';
import { REPO_ROOT } from '@kbn/repo-info';
import { clearKibanaDataPath, getKibanaDataPath, setKibanaDataPath } from './data_path';

jest.mock('fs', () => {
  const actual = jest.requireActual<typeof import('fs')>('fs');
  return {
    ...actual,
    accessSync: jest.fn((...args: Parameters<typeof actual.accessSync>) =>
      actual.accessSync(...args)
    ),
  };
});

const repoDataPath = join(REPO_ROOT, 'data');
const accessSyncMock = Fs.accessSync as jest.MockedFunction<typeof Fs.accessSync>;

const accessError = (code: string): NodeJS.ErrnoException => {
  const error = new Error(code) as NodeJS.ErrnoException;
  error.code = code;
  return error;
};

describe('kibana data path', () => {
  afterEach(() => {
    clearKibanaDataPath();
    accessSyncMock.mockImplementation((...args: Parameters<typeof Fs.accessSync>) =>
      jest.requireActual<typeof import('fs')>('fs').accessSync(...args)
    );
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

  it('uses the install data directory when that directory is readable', () => {
    accessSyncMock.mockImplementation((candidate) => {
      if (String(candidate) !== repoDataPath) {
        throw accessError('ENOENT');
      }
    });

    expect(getKibanaDataPath()).toBe(repoDataPath);
    expect(accessSyncMock).toHaveBeenCalledWith(repoDataPath, Fs.constants.R_OK);
  });

  it('falls back to /var/lib/kibana when the install data directory is not readable', () => {
    accessSyncMock.mockImplementation((candidate) => {
      if (String(candidate) === repoDataPath) {
        throw accessError('EACCES');
      }
    });

    expect(getKibanaDataPath()).toBe('/var/lib/kibana');
  });
});
