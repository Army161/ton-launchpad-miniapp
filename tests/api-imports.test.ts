import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// package.json is "type": "module", so Vercel runs api/ as native Node ESM, which does
// not resolve extensionless relative imports (ERR_MODULE_NOT_FOUND at runtime).
function tsFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? tsFiles(path) : path.endsWith('.ts') ? [path] : [];
  });
}

describe('api imports', () => {
  it('give every relative import a .js extension', () => {
    const bad = tsFiles('api').flatMap((file) =>
      [...readFileSync(file, 'utf8').matchAll(/from\s+['"](\.{1,2}\/[^'"]+)['"]/g)]
        .map((m) => m[1])
        .filter((spec) => !spec.endsWith('.js'))
        .map((spec) => `${file}: ${spec}`),
    );
    expect(bad).toEqual([]);
  });
});
