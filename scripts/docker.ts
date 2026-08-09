import { spawn } from 'node:child_process';

export const DEFAULT_VERSION_TAG = 'dev';
export const IMAGE_NAME = 'hmes98318/music-disc';

const DOCKER_TAG_PATTERN = /^[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$/;

interface DockerCommandOptions {
    readonly captureOutput?: boolean;
}

/** Returns a validated Docker image reference for this project. */
export function getImageReference(versionTag: string): string {
    if (!DOCKER_TAG_PATTERN.test(versionTag)) {
        throw new Error(
            `Invalid Docker version tag "${versionTag}". ` +
            'Use 1-128 letters, numbers, periods, underscores, or hyphens.',
        );
    }

    return `${IMAGE_NAME}:${versionTag}`;
}

/** Runs Docker without a shell so arguments work consistently across platforms. */
export function runDocker(
    args: readonly string[],
    options: DockerCommandOptions = {},
): Promise<string> {
    return new Promise((resolve, reject) => {
        const captureOutput = options.captureOutput ?? false;
        const child = spawn('docker', args, {
            cwd: process.cwd(),
            shell: false,
            stdio: captureOutput ? ['ignore', 'pipe', 'pipe'] : 'inherit',
            windowsHide: true,
        });
        let stdout = '';
        let stderr = '';

        if (captureOutput) {
            child.stdout?.setEncoding('utf8');
            child.stderr?.setEncoding('utf8');
            child.stdout?.on('data', (chunk: string) => {
                stdout += chunk;
            });
            child.stderr?.on('data', (chunk: string) => {
                stderr += chunk;
            });
        }

        child.on('error', (error) => {
            reject(new Error(`Unable to run Docker: ${error.message}`, { cause: error }));
        });
        child.on('close', (exitCode, signal) => {
            if (exitCode === 0) {
                resolve(stdout.trim());
                return;
            }

            const status = signal === null ? `exit code ${exitCode}` : `signal ${signal}`;
            const detail = stderr.trim();
            const message = detail.length === 0 ? '' : `\n${detail}`;
            reject(new Error(`Docker command failed with ${status}.${message}`));
        });
    });
}

/** Builds this project's container image with the supplied reference. */
export async function buildImage(imageReference: string): Promise<void> {
    console.log(`Building ${imageReference}...`);
    await runDocker(['build', '--tag', imageReference, '.']);
}

/** Narrows caught values before reporting or rethrowing them. */
export function assertIsError(error: unknown): asserts error is Error {
    if (!(error instanceof Error)) {
        throw new Error('A non-Error value was thrown.');
    }
}
