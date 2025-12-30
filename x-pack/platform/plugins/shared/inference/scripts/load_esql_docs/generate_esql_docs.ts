/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { run } from '@kbn/dev-cli-runner';
import Fs from 'fs/promises';
import Path from 'path';
import { createWriteStream } from 'fs';
import { mkdtemp } from 'fs/promises';
import { pipeline } from 'stream/promises';
import { execSync } from 'child_process';
import type { Argv } from 'yargs';
import yargs from 'yargs';
import fetch from 'node-fetch';

async function downloadFile(url: string, filePath: string): Promise<void> {
  const dirPath = Path.dirname(filePath);
  await Fs.mkdir(dirPath, { recursive: true });
  const writeStream = createWriteStream(filePath);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download file: ${res.status} ${res.statusText}`);
  }

  if (!res.body) {
    throw new Error('Response body is null');
  }

  await pipeline(res.body, writeStream);
}

function extractYamlCodeBlocks(content: string): string {
  // Match ```yaml ... ``` code blocks and everything after
  const yamlBlockRegex = /```yaml\n([\s\S]*?)```([\s\S]*)/;
  const match = content.match(yamlBlockRegex);

  if (!match) {
    return '';
  }

  const yamlContent = match[1]?.trim() || '';
  const contentAfterYaml = match[2]?.trim() || '';

  // Combine YAML content and everything after the YAML block
  let combined = '';
  if (yamlContent && contentAfterYaml) {
    combined = `${yamlContent}\n\n${contentAfterYaml}`;
  } else if (yamlContent) {
    combined = yamlContent;
  } else if (contentAfterYaml) {
    combined = contentAfterYaml;
  }

  // Remove the first 3 lines, which mark GA or Preview
  if (combined) {
    const lines = combined.split('\n');
    if (lines.length > 3) {
      return lines.slice(3).join('\n');
    } else {
      return '';
    }
  }

  return '';
}

function getCommandName(fileName: string): string {
  // Extract command name from filename (e.g., "match.md" -> "match")
  const baseName = Path.basename(fileName, '.md');
  return baseName;
}

yargs(process.argv.slice(2))
  .command(
    '*',
    'Extract ES|QL documentation from zip file',
    (y: Argv) =>
      y
        .option('logLevel', {
          describe: 'Log level',
          string: true,
          default: process.env.LOG_LEVEL || 'info',
          choices: ['info', 'debug', 'silent', 'verbose'],
        })
        .option('dryRun', {
          describe: 'Do not write or delete any files',
          boolean: true,
          default: false,
        }),
    (argv) => {
      run(
        async ({ log }) => {
          const zipUrl = 'http://elastic.co/docs/llm.zip';
          const tempDir = Path.join(__dirname, '__tmp__');
          const zipPath = Path.join(tempDir, 'llm.zip');
          const extractTempDir = await mkdtemp(Path.join(Path.sep, 'tmp', 'esql-docs-'));
          const extractDir = Path.join(extractTempDir, 'extracted');
          const commandsDir = Path.join(
            extractDir,
            'reference',
            'query-languages',
            'esql',
            'commands'
          );
          const outDir = Path.join(__dirname, '../../server/tasks/nl_to_esql/esql_docs');

          try {
            // Check if zip file already exists
            const zipExists = await Fs.access(zipPath)
              .then(() => true)
              .catch(() => false);

            if (zipExists) {
              log.info(`Zip file already exists at ${zipPath}, skipping download`);
            } else {
              log.info(`Downloading zip file from ${zipUrl}...`);
              await Fs.mkdir(tempDir, { recursive: true });
              await downloadFile(zipUrl, zipPath);
              log.info(`Downloaded to ${zipPath}`);
            }

            log.info(`Extracting zip file to ${extractDir}...`);
            try {
              // Use native unzip command which is more robust
              execSync(`unzip -q -o "${zipPath}" -d "${extractDir}"`, {
                stdio: 'inherit',
              });
              log.info(`Extracted to ${extractDir}`);
            } catch (error) {
              // Try with extract function as fallback
              log.warning(
                `Native unzip failed, trying alternative extraction method: ${
                  error instanceof Error ? error.message : String(error)
                }`
              );
              const { extract } = await import('@kbn/dev-utils');
              try {
                await extract({
                  archivePath: zipPath,
                  targetDir: extractDir,
                });
                log.info(`Extracted to ${extractDir}`);
              } catch (extractError) {
                log.warning(
                  `Extraction encountered errors: ${
                    extractError instanceof Error ? extractError.message : String(extractError)
                  }`
                );
                log.info(`Continuing with partial extraction...`);
              }
            }

            log.info(`Looking for markdown files in ${commandsDir}...`);
            const commandsPathExists = await Fs.access(commandsDir)
              .then(() => true)
              .catch(() => false);

            if (!commandsPathExists) {
              throw new Error(
                `Commands directory not found at ${commandsDir}. Please verify the zip file structure.`
              );
            }

            const files = await Fs.readdir(commandsDir);
            const mdFiles = files.filter((file) => file.endsWith('.md'));

            if (mdFiles.length === 0) {
              throw new Error(`No .md files found in ${commandsDir}`);
            }

            log.info(`Found ${mdFiles.length} markdown files`);

            const docFiles: Array<{ name: string; content: string }> = [];

            for (const mdFile of mdFiles) {
              const filePath = Path.join(commandsDir, mdFile);
              const content = await Fs.readFile(filePath, 'utf-8');
              const yamlContent = extractYamlCodeBlocks(content);

              if (yamlContent) {
                const commandName = getCommandName(mdFile);
                const outputFileName = `esql-${commandName}.txt`;
                docFiles.push({
                  name: outputFileName,
                  content: yamlContent,
                });
                log.info(`Extracted YAML from ${mdFile} -> ${outputFileName}`);
              } else {
                log.warning(`No YAML code blocks found in ${mdFile}, skipping`);
              }
            }

            if (!argv.dryRun) {
              log.info(`Writing ${docFiles.length} documents to disk to ${outDir}`);

              await Fs.mkdir(outDir, { recursive: true });

              await Promise.all(
                docFiles.map(async (file) => {
                  const fileName = Path.join(outDir, file.name);
                  await Fs.writeFile(fileName, file.content);
                })
              );

              log.info(`Successfully wrote ${docFiles.length} files to ${outDir}`);
            } else {
              log.info(`Dry run: Would write ${docFiles.length} files to ${outDir}`);
            }
          } finally {
            // Clean up extraction temp directory (but keep the zip file in _temp_)
            log.info(`Cleaning up temporary extraction directory ${extractTempDir}...`);
            await Fs.rm(extractTempDir, { recursive: true, force: true }).catch((err) => {
              log.warning(`Failed to clean up temp directory: ${err.message}`);
            });
          }
        },
        { log: { defaultLevel: argv.logLevel as any }, flags: { allowUnexpected: true } }
      );
    }
  )
  .parse();
