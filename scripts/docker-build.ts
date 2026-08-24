import {
    assertIsError,
    buildImage,
    DEFAULT_VERSION_TAG,
    getImageReference,
} from './docker.js';

function printUsage(): void {
    console.log('Usage: npm run docker:build -- [version-tag]');
    console.log(`Default version tag: ${DEFAULT_VERSION_TAG}`);
}

async function main(): Promise<void> {
    const args = process.argv.slice(2);

    if (args.length === 1 && (args[0] === '--help' || args[0] === '-h')) {
        printUsage();
        return;
    }
    if (args.length > 1) {
        throw new Error('Expected at most one Docker version tag.');
    }

    const versionTag = args[0] ?? DEFAULT_VERSION_TAG;
    const imageReference = getImageReference(versionTag);
    await buildImage(imageReference);
    console.log(`Built ${imageReference} successfully.`);
}

try {
    await main();
} catch (error: unknown) {
    assertIsError(error);
    console.error(`Docker build failed: ${error.message}`);
    process.exitCode = 1;
}
