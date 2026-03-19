/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { resolve } from 'path';
import Fs from 'fs/promises';
import { spawn } from 'child_process';
import { REPO_ROOT } from '@kbn/repo-info';
import { getArtifactName } from '@kbn/product-doc-common';
import type { ProductName } from '@kbn/product-doc-common';
import type { FtrProviderContext } from '../ftr_provider_context';

// Environment variable for EIS CCM API key (set by CI from Vault)
const EIS_CCM_API_KEY_ENV = 'KIBANA_EIS_CCM_API_KEY';
const eisCcmApiKey = process.env[EIS_CCM_API_KEY_ENV];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const inferenceId = process.env.INFERENCE_ID || '.jina-embeddings-v5-text-small';
const stackDocsVersion = process.env.STACK_DOCS_VERSION || 'latest';
const sourceClusterUrl = process.env.KIBANA_SOURCE_CLUSTER_URL;
const sourceClusterApiKey = process.env.KIBANA_SOURCE_CLUSTER_API_KEY;
const sourceClusterIndex = process.env.KIBANA_SOURCE_INDEX;

const embeddingClusterUrl = 'http://localhost:9220';
const embeddingClusterUsername = 'elastic';
const embeddingClusterPassword = 'changeme';

// eslint-disable-next-line import/no-default-export
export default function ({ getService }: FtrProviderContext) {
  const log = getService('log');
  const es = getService('es');
  const retry = getService('retry');

  describe('EIS product docs artifact generation', function () {
    this.timeout(170 * 60 * 1000);
    const scriptsDir = resolve(REPO_ROOT, 'scripts');
    const nodeBin = process.execPath;

    const baseArgs = [
      resolve(scriptsDir, 'build_product_doc_artifacts.js'),
      `--stack-version=${stackDocsVersion}`,
      `--inference-id=${inferenceId}`,
      `--sourceClusterUrl=${sourceClusterUrl}`,
      `--sourceClusterApiKey=${sourceClusterApiKey}`,
      `--sourceClusterIndex=${sourceClusterIndex}`,
      `--embeddingClusterUrl=${embeddingClusterUrl}`,
      `--embeddingClusterUsername=${embeddingClusterUsername}`,
      `--embeddingClusterPassword=${embeddingClusterPassword}`,
    ];

    const commands = [
      [...baseArgs, '--product-name=kibana'],
      [...baseArgs, '--product-name=elasticsearch'],
      [...baseArgs, '--product-name=observability'],
      [...baseArgs, '--product-name=security'],
    ];

    const waitForProductDocIndex = async (productName: string) => {
      const indexName = `.kibana_ai_product_doc_${productName}-${inferenceId}`;

      await retry.waitForWithTimeout(
        `Elasticsearch index [${indexName}] should exist`,
        5 * 60 * 1000,
        async () => {
          if (await es.indices.exists({ index: indexName })) {
            return true;
          }

          throw new Error(`Expected Elasticsearch index '[${indexName}]' to exist.`);
        }
      );
    };

    const waitForArtifactZip = async (productName: ProductName) => {
      const artifactsDir = resolve(REPO_ROOT, 'build', 'kb-artifacts');
      const artifactName = getArtifactName({
        productName,
        productVersion: 'latest',
        inferenceId,
      });
      const artifactPath = resolve(artifactsDir, artifactName);

      await retry.waitForWithTimeout(
        `Artifact zip [${artifactPath}] should exist`,
        30 * 60 * 1000, // 30 minutes
        async () => {
          try {
            await Fs.access(artifactPath);
            return true;
          } catch {
            throw new Error(`Expected artifact zip '[${artifactPath}]' to exist.`);
          }
        }
      );
    };

    before(async () => {
      if (!eisCcmApiKey) {
        log.warning(
          `[EIS] ${EIS_CCM_API_KEY_ENV} is not set; skipping CCM enablement and assuming endpoints already exist`
        );
        return;
      }

      log.info('[EIS] Enabling Cloud Connected Mode...');
      await es.transport.request({
        method: 'PUT',
        path: '/_inference/_ccm',
        body: { api_key: eisCcmApiKey },
      });
      log.info('[EIS] ✅ CCM enabled');

      // Wait for EIS to provision endpoints
      log.info('[EIS] Waiting for EIS endpoints to be provisioned...');
      const maxRetries = 5;
      const retryDelayMs = 3000;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const response = await es.inference.get({ inference_id: '_all' });
        const endpoints = response.endpoints as Array<{
          task_type: string;
          service: string;
          inference_id?: string;
        }>;
        const eisEndpoints = endpoints.filter(
          (ep) =>
            ep.service === 'elastic' &&
            (ep.task_type === 'embedding' ||
              ep.task_type === 'embeddings' ||
              ep.inference_id === inferenceId)
        );

        if (eisEndpoints.length > 0) {
          log.info(
            `[EIS] ✅ Found ${eisEndpoints.length} EIS embeddings endpoints on attempt ${attempt}`
          );
          return;
        }
        if (attempt < maxRetries) {
          log.info(`[EIS] No endpoints yet (attempt ${attempt}/${maxRetries}), waiting...`);

          await sleep(retryDelayMs);
        }
      }

      log.warning('[EIS] ⚠️ No EIS endpoints found after waiting');
    });

    it('runs product doc artifact builds against EIS', async () => {
      for (const args of commands) {
        const cmd = `${nodeBin} ${args.join(' ')}`;
        log.info(`Running product doc artifact build: ${cmd}`);

        const productNameArg = args.find((arg) => arg.startsWith('--product-name='));
        const productName = productNameArg?.split('=')[1] as ProductName | undefined;

        await new Promise<void>((resolvePromise, rejectPromise) => {
          const child = spawn(nodeBin, args, {
            cwd: REPO_ROOT,
            stdio: 'inherit',
            env: process.env,
          });

          child.on('exit', async (code: number | null) => {
            if (code === 0) {
              resolvePromise();
              return;
            }

            if (!productName) {
              rejectPromise(new Error(`Command failed with exit code ${code}: ${cmd}`));
              return;
            }

            log.warning(
              `Command exited with code ${code} for product [${productName}]. Waiting for index to be ready before failing.`
            );

            try {
              await waitForProductDocIndex(productName);
              log.info(
                `Index for product [${productName}] became available despite non-zero exit code ${code}`
              );
              resolvePromise();
            } catch (err) {
              rejectPromise(
                new Error(
                  `Command failed with exit code ${code} and index for product [${productName}] did not become ready: ${cmd}. Underlying error: ${
                    (err as Error).message
                  }`
                )
              );
            }
          });

          child.on('error', (err: Error) => {
            rejectPromise(err);
          });
        });

        if (productName) {
          await waitForArtifactZip(productName);
        }
      }
    });
  });
}
