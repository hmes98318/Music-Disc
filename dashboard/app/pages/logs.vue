<template>
    <div class="flex h-full flex-col gap-4">
        <!-- Header -->
        <div class="flex shrink-0 flex-wrap items-center justify-between gap-3">
            <h1 class="font-display text-xl font-extrabold tracking-wide text-snow">{{ $t('logs.title') }}</h1>
            <div class="flex items-center gap-2">
                <span class="rounded-full bg-surface px-3 py-1 text-xs text-fog">
                    {{ $t('localnode.total', { count: logStream.totalItems.value }) }}
                </span>
                <span class="rounded-full bg-blurple/15 px-3 py-1 text-xs font-medium text-blurple-light">
                    {{ $t('index.refreshIn', { countdown }) }}
                </span>
            </div>
        </div>

        <!-- Full-height log terminal panel -->
        <div class="min-h-0 flex-1 rounded-2xl bg-panel p-4 shadow">
            <LogConsole
                ref="logConsole"
                :entries="logStream.logs.value"
                :initial-loading="logStream.loading.value"
                :loading-older="logStream.loadingOlder.value"
                :stretch="true"
                :empty-text="$t('localnode.emptyLogs')"
                @reach-top="loadOlderLogs"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
type LogConsoleInstance = {
    captureSnapshot: () => { scrollHeight: number; scrollTop: number };
    isNearBottom: () => boolean;
    restoreSnapshot: (s: { scrollHeight: number; scrollTop: number }) => void;
    scrollToBottom: () => void;
};

const api = useApi();
const logStream = useLogStream((q) => api.getBotLogs(q));
const logConsole = ref<LogConsoleInstance | null>(null);
const { countdown } = useAutoRefresh(1_000, refreshLogs, { immediate: false });

onMounted(() => {
    logStream.fetchInitial(() => logConsole.value?.scrollToBottom());
});

async function refreshLogs() {
    await logStream.refreshLatest(
        () => logConsole.value?.isNearBottom() ?? true,
        () => logConsole.value?.scrollToBottom(),
    );
}

async function loadOlderLogs() {
    await logStream.loadOlder(
        () => logConsole.value?.captureSnapshot() ?? { scrollHeight: 0, scrollTop: 0 },
        (s) => logConsole.value?.restoreSnapshot(s),
    );
}
</script>
