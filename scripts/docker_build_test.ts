import {
    assertIsError,
    buildImage,
    getImageReference,
    runDocker,
} from './docker.js';

const EXPECTED_ENTRYPOINT = ['npm', 'run', 'start:server'];
const REQUIRED_PATHS = [
    '/bot/config.js',
    '/bot/dashboard/.output/public/index.html',
    '/bot/dist/src/index.js',
    '/bot/node_modules/discord.js/package.json',
    '/bot/package-lock.json',
    '/bot/package.json',
    '/bot/server',
    '/usr/bin/java',
];

async function verifyImageConfiguration(imageReference: string): Promise<void> {
    const workingDirectory = await runDocker([
        'image',
        'inspect',
        '--format',
        '{{.Config.WorkingDir}}',
        imageReference,
    ], { captureOutput: true });
    if (workingDirectory !== '/bot') {
        throw new Error(
            `Expected image working directory "/bot", received "${workingDirectory}".`,
        );
    }

    const entrypointJson = await runDocker([
        'image',
        'inspect',
        '--format',
        '{{json .Config.Entrypoint}}',
        imageReference,
    ], { captureOutput: true });
    const entrypoint: unknown = JSON.parse(entrypointJson);
    if (!Array.isArray(entrypoint) ||
        !entrypoint.every((value): value is string => typeof value === 'string') ||
        entrypoint.length !== EXPECTED_ENTRYPOINT.length ||
        !entrypoint.every((value, index) => value === EXPECTED_ENTRYPOINT[index])) {
        throw new Error(
            `Expected image entrypoint ${JSON.stringify(EXPECTED_ENTRYPOINT)}, ` +
            `received ${entrypointJson}.`,
        );
    }
}

async function verifyRequiredFiles(imageReference: string): Promise<void> {
    const verificationScript = [
        "const fs = require('node:fs');",
        `const requiredPaths = ${JSON.stringify(REQUIRED_PATHS)};`,
        'const missingPaths = requiredPaths.filter((path) => !fs.existsSync(path));',
        'if (missingPaths.length > 0) {',
        "  console.error(`Missing image paths: ${missingPaths.join(', ')}`);",
        '  process.exit(1);',
        '}',
        "const Database = require('better-sqlite3');",
        "const database = new Database(':memory:');",
        'database.close();',
        "console.log('Container runtime smoke test passed.');",
    ].join('\n');

    await runDocker([
        'run',
        '--rm',
        '--entrypoint',
        'node',
        imageReference,
        '-e',
        verificationScript,
    ]);
}

async function main(): Promise<void> {
    if (process.argv.length > 2) {
        throw new Error('docker:build:test does not accept arguments.');
    }

    const testTag = `build-test-${process.pid}-${Date.now()}`;
    const imageReference = getImageReference(testTag);
    let cleanupError: Error | undefined;
    let imageBuilt = false;
    let testError: Error | undefined;

    try {
        console.log('[1/4] Checking the Docker build configuration...');
        await runDocker(['build', '--check', '.']);

        console.log('[2/4] Building the test image...');
        await buildImage(imageReference);
        imageBuilt = true;

        console.log('[3/4] Verifying image configuration...');
        await verifyImageConfiguration(imageReference);

        console.log('[4/4] Verifying files inside an isolated container...');
        await verifyRequiredFiles(imageReference);

        console.log('Container build test passed.');
    } catch (error: unknown) {
        assertIsError(error);
        testError = error;
    } finally {
        if (imageBuilt) {
            console.log(`Removing test image ${imageReference}...`);
            try {
                await runDocker(['image', 'rm', '--force', imageReference]);
            } catch (error: unknown) {
                assertIsError(error);
                cleanupError = error;
            }
        }
    }

    if (testError !== undefined) {
        if (cleanupError !== undefined) {
            console.error(`Image cleanup also failed: ${cleanupError.message}`);
        }
        throw testError;
    }
    if (cleanupError !== undefined) {
        throw cleanupError;
    }
}

try {
    await main();
} catch (error: unknown) {
    assertIsError(error);
    console.error(`Container build test failed: ${error.message}`);
    process.exitCode = 1;
}
