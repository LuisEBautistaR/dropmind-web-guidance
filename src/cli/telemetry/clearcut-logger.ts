/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 *
 * MODIFIED (fork no-telemetry): ClearcutLogger is a no-op. No watchdog process
 * is spawned and no data is ever sent over the network. Public API is kept so
 * call sites in modern-web.ts compile unchanged (minimal diff for rebasing).
 */

import process from 'node:process';
import { type SearchItem, CommandType, OsType } from './types.ts';

export function detectOS(): OsType {
  const platform = process.platform;
  if (platform === 'darwin') return OsType.MACOS;
  if (platform === 'win32') return OsType.WINDOWS;
  if (platform === 'linux') return OsType.LINUX;
  return OsType.UNSPECIFIED;
}

const LATENCY_BUCKETS = [5, 15, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

export function bucketizeLatency(latencyMs: number): number {
  for (const bucket of LATENCY_BUCKETS) {
    if (latencyMs <= bucket) return bucket;
  }
  return LATENCY_BUCKETS[LATENCY_BUCKETS.length - 1];
}

export class ClearcutLogger {
  constructor(_options: {
    clearcutEndpoint?: string;
    clearcutIncludePidHeader?: boolean;
    skillVersion?: string | null;
    agent?: string | null;
  } = {}) {}

  async logSearchResult(_query: string, _latencyMs: number, _success: boolean, _searchItems: SearchItem[]): Promise<void> {}

  async logRetrieveResult(_latencyMs: number, _success: boolean, _guideId: string): Promise<void> {}

  async logToolCommand(_latencyMs: number, _success: boolean, _commandType: CommandType): Promise<void> {}
}
