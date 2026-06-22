<template>
    <div class="flex h-full flex-col gap-4">
        <!-- Header -->
        <div class="flex shrink-0 flex-wrap items-center justify-between gap-3">
            <h1 class="font-display text-xl font-extrabold tracking-wide text-snow">{{ $t('localnode.title') }}</h1>
            <div class="flex items-center gap-2">
                <span class="rounded-full bg-surface px-3 py-1 text-xs text-fog">
                    {{ $t('index.refreshIn', { countdown: logCountdown }) }}
                </span>
                <span class="rounded-full bg-blurple/15 px-3 py-1 text-xs font-medium text-blurple-light">
                    {{ $t('index.refreshIn', { countdown: statusCountdown }) }}
                </span>
            </div>
        </div>

        <!-- Page loading -->
        <div v-if="pageLoading" class="flex flex-1 items-center justify-center">
            <span class="inline-block size-8 animate-spin rounded-full border-[3px] border-line border-t-blurple" />
        </div>

        <template v-else>
            <!-- Error (no data) -->
            <div
                v-if="localNodeStore.error && !localNodeStore.summary"
                class="shrink-0 rounded-2xl bg-panel p-6 text-center text-danger shadow"
            >
                {{ localNodeStore.error }}
            </div>

            <template v-else>
                <!-- Compact status + controls bar -->
                <div class="shrink-0 rounded-2xl bg-panel px-6 py-4 shadow">
                    <div class="flex flex-wrap items-center justify-between gap-4">
                        <!-- Status fields (horizontal) -->
                        <div class="flex flex-wrap items-center gap-x-6 gap-y-3">
                            <div class="flex items-center gap-2">
                                <span class="text-[11px] font-semibold tracking-wide text-muted">{{ $t('common.status') }}</span>
                                <span
                                    class="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                                    :class="
                                        localNodeStore.summary?.enabled
                                            ? 'bg-online/15 text-online'
                                            : 'bg-danger/15 text-danger'
                                    "
                                >
                                    {{ localNodeStore.summary?.enabled ? $t('common.enabled') : $t('common.disabled') }}
                                </span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-[11px] font-semibold tracking-wide text-muted">{{ $t('localnode.process') }}</span>
                                <span class="rounded-full px-2.5 py-0.5 text-xs font-semibold" :class="processClass">
                                    {{ processLabel }}
                                </span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-[11px] font-semibold tracking-wide text-muted">{{ $t('localnode.pid') }}</span>
                                <span class="text-sm font-medium text-snow">
                                    {{ localNodeStore.summary?.process.pid ?? '—' }}
                                </span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-[11px] font-semibold tracking-wide text-muted">{{ $t('localnode.port') }}</span>
                                <span class="text-sm font-medium text-snow">
                                    {{ localNodeStore.summary?.process.port ?? '—' }}
                                </span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-[11px] font-semibold tracking-wide text-muted">{{ $t('localnode.autoRestart') }}</span>
                                <span
                                    class="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                                    :class="
                                        localNodeStore.summary?.process.autoRestart
                                            ? 'bg-online/15 text-online'
                                            : 'bg-line/50 text-muted'
                                    "
                                >
                                    {{ localNodeStore.summary?.process.autoRestart ? $t('common.enabled') : $t('common.disabled') }}
                                </span>
                            </div>
                        </div>

                        <!-- Control buttons -->
                        <div class="flex shrink-0 items-center gap-2">
                            <button
                                class="flex items-center gap-2 rounded-xl bg-blurple px-4 py-2 text-sm font-semibold text-white transition hover:bg-blurple-dark disabled:opacity-50"
                                :disabled="
                                    localNodeStore.controlLoading ||
                                    !localNodeStore.summary?.enabled ||
                                    localNodeStore.summary?.process.starting
                                "
                                @click="handleRestart"
                            >
                                <span
                                    v-if="localNodeStore.controlLoading && currentAction === 'restart'"
                                    class="inline-block size-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                                />
                                <Icon v-else name="lucide:refresh-cw" class="size-4" />
                                {{ $t('localnode.restarting') }}
                            </button>
                            <button
                                class="flex items-center gap-2 rounded-xl bg-danger px-4 py-2 text-sm font-semibold text-white transition hover:opacity-85 disabled:opacity-50"
                                :disabled="
                                    localNodeStore.controlLoading ||
                                    !localNodeStore.summary?.enabled ||
                                    localNodeStore.summary?.process.starting
                                "
                                @click="handleStop"
                            >
                                <span
                                    v-if="localNodeStore.controlLoading && currentAction === 'stop'"
                                    class="inline-block size-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                                />
                                <Icon v-else name="lucide:square" class="size-4" />
                                {{ $t('localnode.stop') }}
                            </button>
                        </div>
                    </div>

                    <!-- Control feedback message -->
                    <p
                        v-if="localNodeStore.controlMessage"
                        class="mt-3 text-sm"
                        :class="localNodeStore.controlSuccess ? 'text-online' : 'text-danger'"
                    >
                        {{ localNodeStore.controlMessage }}
                    </p>
                </div>

                <!-- Disabled notice (fills remaining height) -->
                <div
                    v-if="!localNodeStore.summary?.enabled"
                    class="flex flex-1 items-center justify-center rounded-2xl bg-panel text-sm text-muted shadow"
                >
                    {{ $t('localnode.disabledNotice') }}
                </div>

                <!-- Logs panel (fills remaining height) -->
                <div v-else class="flex min-h-0 flex-1 flex-col gap-3 rounded-2xl bg-panel p-4 shadow">
                    <div class="flex shrink-0 items-center justify-between">
                        <div>
                            <h2 class="text-[13px] font-semibold tracking-wide text-muted">{{ $t('localnode.logs') }}</h2>
                            <p class="mt-0.5 text-xs text-muted">{{ $t('localnode.scrollNotice') }}</p>
                        </div>
                        <span class="rounded-full bg-surface px-3 py-1 text-xs text-fog">
                            {{ $t('localnode.total', { count: logStream.totalItems.value }) }}
                        </span>
                    </div>

                    <div class="min-h-0 flex-1">
                        <LogConsole
                            ref="logConsole"
                            :entries="logStream.logs.value"
                            :initial-loading="logStream.loading.value"
                            :loading-older="logStream.loadingOlder.value"
                            :stretch="true"
                            :nowrap="true"
                            :empty-text="$t('localnode.emptyLogs')"
                            @reach-top="loadOlderLogs"
                        />
                    </div>
                </div>
            </template>
        </template>
    </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

type LogConsoleInstance = {
    captureSnapshot: () => { scrollHeight: number; scrollTop: number };
    isNearBottom: () => boolean;
    restoreSnapshot: (s: { scrollHeight: number; scrollTop: number }) => void;
    scrollToBottom: () => void;
};

const api = useApi();
const localNodeStore = useLocalNodeStore();
const logStream = useLogStream((q) => api.getLocalNodeLogs(q));
const logConsole = ref<LogConsoleInstance | null>(null);
const pageLoading = ref(true);
const currentAction = ref<'restart' | 'stop' | ''>('');
const { t } = useI18n();

const processLabel = computed(() => {
    const p = localNodeStore.summary?.process;
    if (!p) return '—';
    if (p.starting) return t('localnode.starting');
    return p.active ? t('localnode.running') : t('localnode.stopped');
});

const processClass = computed(() => {
    const p = localNodeStore.summary?.process;
    if (!p) return 'bg-line/50 text-muted';
    if (p.starting) return 'bg-warning/15 text-warning';
    return p.active ? 'bg-online/15 text-online' : 'bg-danger/15 text-danger';
});

const { countdown: statusCountdown } = useAutoRefresh(3_000, localNodeStore.fetchSummary, { immediate: false });
const { countdown: logCountdown } = useAutoRefresh(1_000, refreshLogs, { immediate: false });

onMounted(async () => {
    await localNodeStore.fetchSummary();
    pageLoading.value = false;
    if (localNodeStore.summary?.enabled) {
        await logStream.fetchInitial(() => logConsole.value?.scrollToBottom());
    }
});

async function refreshLogs() {
    if (!localNodeStore.summary?.enabled) return;
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

async function handleRestart() {
    currentAction.value = 'restart';
    await localNodeStore.restart();
    currentAction.value = '';
}

async function handleStop() {
    currentAction.value = 'stop';
    await localNodeStore.stop();
    currentAction.value = '';
}
</script>
