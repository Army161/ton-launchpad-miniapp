/**
 * `--env-file=<path>` for the operator CLIs, so a run does not depend on the
 * shell (`set -a && source .env.testnet` has no PowerShell equivalent).
 *
 * A variable that is already set in the environment wins over the file, so a
 * one-off override on the command line keeps working. Values are never printed.
 */
import * as fs from 'fs';
import * as path from 'path';

const LINE = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/;

/** Parses dotenv text: `KEY=value`, optional quotes, `#` comments, no interpolation. */
export function parseEnvFile(text: string): Record<string, string> {
    const out: Record<string, string> = {};
    for (const raw of text.split(/\r?\n/)) {
        if (/^\s*(#|$)/.test(raw)) continue;
        const m = LINE.exec(raw);
        if (!m) continue;
        let value = m[2].trim();
        const quote = value[0];
        if ((quote === '"' || quote === "'") && value.indexOf(quote, 1) > 0) {
            value = value.slice(1, value.indexOf(quote, 1));
        } else {
            // Unquoted: a comment starts at '#' at the start or after whitespace.
            value = value.replace(/(^|\s+)#.*$/, '').trim();
        }
        out[m[1]] = value;
    }
    return out;
}

/**
 * Path given with `--env-file=<path>` (or `--env-file <path>`), or null when the
 * flag is absent. A flag without a path throws: it must not fall back to the shell.
 */
export function envFileArg(argv: readonly string[] = process.argv): string | null {
    for (let i = 0; i < argv.length; i++) {
        let value: string | undefined;
        if (argv[i].startsWith('--env-file=')) value = argv[i].slice('--env-file='.length);
        else if (argv[i] === '--env-file') value = argv[i + 1];
        else continue;
        if (!value || value.startsWith('--')) throw new Error('--env-file needs a file path');
        return value;
    }
    return null;
}

/**
 * Loads the file named by `--env-file` into `env` and returns its resolved path,
 * or null when the flag is absent. Throws when the file does not exist: a typo
 * must not silently fall back to whatever the shell happens to hold.
 */
export function loadEnvFileArg(argv: readonly string[] = process.argv, env: NodeJS.ProcessEnv = process.env): string | null {
    const arg = envFileArg(argv);
    if (!arg) return null;
    const file = path.resolve(arg);
    if (!fs.existsSync(file)) throw new Error(`Env file not found: ${file}`);
    for (const [key, value] of Object.entries(parseEnvFile(fs.readFileSync(file, 'utf8')))) {
        if (env[key] === undefined || env[key] === '') env[key] = value;
    }
    return file;
}
