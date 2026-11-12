import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { envFileArg, loadEnvFileArg, parseEnvFile } from '../scripts/lib/env';

describe('--env-file loader', () => {
    it('parses plain, quoted, exported and commented lines', () => {
        const parsed = parseEnvFile(
            [
                '# a comment',
                '',
                'PLAIN=value',
                'export EXPORTED=yes',
                'SPACED = padded value   ',
                'QUOTED="one two three"',
                "SINGLE='four five'",
                'WITH_COMMENT=v5r1   # trailing note',
                'HASH_IN_VALUE=abc#def',
                'EMPTY=',
                '# COMMENTED=out',
                'not a pair',
            ].join('\r\n'),
        );
        expect(parsed).toEqual({
            PLAIN: 'value',
            EXPORTED: 'yes',
            SPACED: 'padded value',
            QUOTED: 'one two three',
            SINGLE: 'four five',
            WITH_COMMENT: 'v5r1',
            HASH_IN_VALUE: 'abc#def',
            EMPTY: '',
        });
    });

    it('keeps an unquoted multi-word value whole (a mnemonic written without quotes)', () => {
        const words = Array.from({ length: 24 }, (_, i) => `word${i + 1}`).join(' ');
        expect(parseEnvFile(`DEPLOY_MNEMONIC=${words}\n`).DEPLOY_MNEMONIC).toBe(words);
    });

    it('finds the flag in both spellings', () => {
        expect(envFileArg(['node', 'x', '--env-file=.env.testnet'])).toBe('.env.testnet');
        expect(envFileArg(['node', 'x', '--env-file', 'a.env', '--execute'])).toBe('a.env');
        expect(envFileArg(['node', 'x', '--execute'])).toBeNull();
    });

    it('loads the file without overriding what the environment already holds', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'envfile-'));
        const file = path.join(dir, '.env.test');
        fs.writeFileSync(file, 'FROM_FILE=file\nALREADY=file\nBLANK_IN_ENV=file\n');
        const env: NodeJS.ProcessEnv = { ALREADY: 'shell', BLANK_IN_ENV: '' };
        expect(loadEnvFileArg(['node', 'x', `--env-file=${file}`], env)).toBe(file);
        expect(env).toEqual({ FROM_FILE: 'file', ALREADY: 'shell', BLANK_IN_ENV: 'file' });
        fs.rmSync(dir, { recursive: true });
    });

    it('does nothing without the flag and fails loudly on a missing file', () => {
        const env: NodeJS.ProcessEnv = {};
        expect(loadEnvFileArg(['node', 'x'], env)).toBeNull();
        expect(env).toEqual({});
        expect(() => loadEnvFileArg(['node', 'x', '--env-file=/nonexistent/.env'], env)).toThrow('Env file not found');
    });
});
