<template>
    <div>
        <!-- Header -->
        <div class="mb-6 flex items-center justify-between">
            <h1 class="font-display text-xl font-extrabold tracking-wide text-snow">{{ $t('nodes.title') }}</h1>
            <span class="rounded-full bg-blurple/15 px-3 py-1 text-xs font-medium text-blurple-light">
                {{ $t('index.refreshIn', { countdown }) }}
            </span>
        </div>

        <!-- Loading -->
        <div v-if="nodesStore.loading" class="flex min-h-50 items-center justify-center">
            <span class="inline-block size-8 animate-spin rounded-full border-[3px] border-line border-t-blurple" />
        </div>

        <!-- Error -->
        <div v-else-if="nodesStore.error && nodesStore.items.length === 0" class="text-center text-sm text-danger">
            {{ nodesStore.error }}
        </div>

        <!-- Nodes grid -->
        <div v-else class="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <!-- Empty state -->
            <div v-if="nodesStore.items.length === 0" class="col-span-full py-12 text-center text-muted">
                {{ $t('nodes.emptyNodes') }}
            </div>

            <!-- Node card -->
            <div v-for="node in nodesStore.items" :key="node.id" class="overflow-hidden rounded-2xl bg-panel">
                <!-- Card header -->
                <div class="flex items-center justify-between px-5 py-4">
                    <div class="flex min-w-0 items-center gap-2.5">
                        <span class="size-2.5 shrink-0 rounded-full" :class="stateDotClass(node.state)" />
                        <span class="truncate font-display text-base font-bold text-snow">{{ node.id }}</span>
                    </div>
                    <div class="ml-3 flex shrink-0 items-center gap-3">
                        <span class="font-mono text-sm text-muted">
                            {{ node.ping >= 0 ? `${node.ping} ms` : '— ms' }}
                        </span>
                        <span class="rounded-full px-2.5 py-0.5 text-xs font-semibold" :class="stateClass(node.state)">
                            {{ stateName(node.state) }}
                        </span>
                    </div>
                </div>

                <!-- Connected: full detail -->
                <template v-if="isConnected(node.state)">
                    <!-- Key stats row -->
                    <div class="grid grid-cols-4 divide-x divide-line border-y border-line">
                        <div class="px-3 py-3 text-center">
                            <p class="text-[10px] font-semibold tracking-wide text-muted">{{ $t('nodes.players') }}</p>
                            <p class="mt-1 text-lg font-bold text-snow leading-none">
                                {{ nodeStats(node)?.players ?? '—' }}
                            </p>
                        </div>
                        <div class="px-3 py-3 text-center">
                            <p class="text-[10px] font-semibold tracking-wide text-muted">{{ $t('servers.playing') }}</p>
                            <p class="mt-1 text-lg font-bold text-online leading-none">
                                {{ nodeStats(node)?.playingPlayers ?? '—' }}
                            </p>
                        </div>
                        <div class="px-3 py-3 text-center">
                            <p class="text-[10px] font-semibold tracking-wide text-muted">{{ $t('nodes.cpuCores') }}</p>
                            <p class="mt-1 text-lg font-bold text-snow leading-none">
                                {{ nodeStats(node)?.cpu?.cores ?? '—' }}
                            </p>
                        </div>
                        <div class="px-3 py-3 text-center">
                            <p class="text-[10px] font-semibold tracking-wide text-muted">{{ $t('common.uptime') }}</p>
                            <p class="mt-1 text-sm font-bold text-snow leading-none">
                                {{ formatUptime(nodeStats(node)?.uptime) }}
                            </p>
                        </div>
                    </div>

                    <!-- Performance section -->
                    <div class="border-b border-line px-5 py-4">
                        <div class="grid grid-cols-2 gap-x-6 gap-y-3">
                            <div>
                                <p class="text-[10px] font-semibold tracking-wide text-muted">{{ $t('nodes.cpuSystem') }}</p>
                                <ProgressBar
                                    :value="cpuSystemPercent(node)"
                                    :label="`${cpuSystemPercent(node).toFixed(1)}%`"
                                />
                            </div>
                            <div>
                                <p class="text-[10px] font-semibold tracking-wide text-muted">{{ $t('nodes.cpuLavalink') }}</p>
                                <ProgressBar
                                    :value="cpuLavalinkPercent(node)"
                                    :label="`${cpuLavalinkPercent(node).toFixed(1)}%`"
                                />
                            </div>
                            <div class="col-span-2">
                                <p class="text-[10px] font-semibold tracking-wide text-muted">{{ $t('common.ram') }}</p>
                                <ProgressBar :value="memPercent(node)" :label="memLabel(node)" />
                            </div>
                        </div>
                    </div>

                    <!-- Software versions row -->
                    <div class="grid grid-cols-3 divide-x divide-line border-b border-line">
                        <div class="px-5 py-3">
                            <p class="text-[10px] font-semibold tracking-wide text-muted">{{ $t('nodes.version') }}</p>
                            <p class="mt-0.5 font-mono text-sm font-medium text-snow">
                                {{ nodeInfo(node)?.version?.semver ?? '—' }}
                            </p>
                        </div>
                        <div class="px-5 py-3">
                            <p class="text-[10px] font-semibold tracking-wide text-muted">{{ $t('nodes.jvm') }}</p>
                            <p class="mt-0.5 truncate font-mono text-sm font-medium text-snow">
                                {{ nodeInfo(node)?.jvm ?? '—' }}
                            </p>
                        </div>
                        <div class="px-5 py-3">
                            <p class="text-[10px] font-semibold tracking-wide text-muted">{{ $t('nodes.lavaplayer') }}</p>
                            <p class="mt-0.5 font-mono text-sm font-medium text-snow">
                                {{ nodeInfo(node)?.lavaplayer ?? '—' }}
                            </p>
                        </div>
                    </div>

                    <!-- Git info row -->
                    <div class="grid grid-cols-3 divide-x divide-line border-b border-line">
                        <div class="px-5 py-3">
                            <p class="text-[10px] font-semibold tracking-wide text-muted">{{ $t('nodes.branch') }}</p>
                            <p class="mt-0.5 truncate font-mono text-sm text-fog">
                                {{ nodeInfo(node)?.git?.branch ?? '—' }}
                            </p>
                        </div>
                        <div class="px-5 py-3">
                            <p class="text-[10px] font-semibold tracking-wide text-muted">{{ $t('nodes.commit') }}</p>
                            <p class="mt-0.5 font-mono text-sm text-fog">
                                {{ nodeInfo(node)?.git?.commit ?? '—' }}
                            </p>
                        </div>
                        <div class="px-5 py-3">
                            <p class="text-[10px] font-semibold tracking-wide text-muted">{{ $t('nodes.build') }}</p>
                            <p class="mt-0.5 text-sm text-fog">{{ formatBuildDate(nodeInfo(node)?.buildTime) }}</p>
                        </div>
                    </div>

                    <!-- Source managers -->
                    <div class="border-b border-line px-5 py-3">
                        <p class="mb-2 text-[10px] font-semibold tracking-wide text-muted">{{ $t('nodes.sources') }}</p>
                        <div class="flex flex-wrap gap-1.5">
                            <span
                                v-for="src in nodeInfo(node)?.sourceManagers ?? []"
                                :key="src"
                                class="rounded-md bg-bg px-2 py-0.5 font-mono text-[11px] text-fog"
                            >
                                {{ src }}
                            </span>
                            <span v-if="(nodeInfo(node)?.sourceManagers ?? []).length === 0" class="text-xs text-muted">
                                —
                            </span>
                        </div>
                    </div>

                    <!-- Filters -->
                    <div class="border-b border-line px-5 py-3">
                        <p class="mb-2 text-[10px] font-semibold tracking-wide text-muted">{{ $t('nodes.filters') }}</p>
                        <div class="flex flex-wrap gap-1.5">
                            <span
                                v-for="filter in nodeInfo(node)?.filters ?? []"
                                :key="filter"
                                class="rounded-md bg-bg px-2 py-0.5 font-mono text-[11px] text-fog"
                            >
                                {{ filter }}
                            </span>
                            <span v-if="(nodeInfo(node)?.filters ?? []).length === 0" class="text-xs text-muted">
                                —
                            </span>
                        </div>
                    </div>

                    <!-- Plugins -->
                    <div class="px-5 py-3">
                        <p class="mb-2 text-[10px] font-semibold tracking-wide text-muted">{{ $t('nodes.plugins') }}</p>
                        <div class="flex flex-wrap gap-2">
                            <div
                                v-for="plugin in nodeInfo(node)?.plugins ?? []"
                                :key="plugin.name"
                                class="flex items-center gap-1.5 rounded-md bg-bg px-2.5 py-1"
                            >
                                <span class="text-xs font-medium text-snow">{{ plugin.name }}</span>
                                <span class="font-mono text-[10px] text-muted">v{{ plugin.version }}</span>
                            </div>
                            <span v-if="(nodeInfo(node)?.plugins ?? []).length === 0" class="text-xs text-muted">
                                —
                            </span>
                        </div>
                    </div>
                </template>

                <!-- Not connected state -->
                <template v-else>
                    <div class="border-t border-line px-5 py-8 text-center text-sm text-muted">
                        {{ $t('nodes.notConnected') }}
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { NodeStatus } from '~/composables/useApi';

/** Typed shape of node.info from GET /api/nodes */
interface NodeInfoData {
    version?: { semver?: string; major?: number; minor?: number; patch?: number };
    buildTime?: number;
    git?: { branch?: string; commit?: string; commitTime?: number };
    jvm?: string;
    lavaplayer?: string;
    sourceManagers?: string[];
    filters?: string[];
    plugins?: { name: string; version: string }[];
}

/** Typed shape of node.stats from GET /api/nodes */
interface NodeStatsData {
    players?: number;
    playingPlayers?: number;
    uptime?: number;
    memory?: { free?: number; used?: number; allocated?: number; reservable?: number };
    cpu?: { cores?: number; systemLoad?: number; lavalinkLoad?: number };
}

const NodeStateEnum = { CONNECTING: 0, CONNECTED: 1, DISCONNECTED: 2, RECONNECTING: 3 };

const nodesStore = useNodesStore();
const { t } = useI18n();
const { countdown } = useAutoRefresh(10_000, nodesStore.fetch);

function isConnected(state: number): boolean {
    return state === NodeStateEnum.CONNECTED;
}

function stateDotClass(state: number): string {
    if (state === NodeStateEnum.CONNECTED) return 'bg-online';
    if (state === NodeStateEnum.CONNECTING || state === NodeStateEnum.RECONNECTING) return 'bg-warning';
    return 'bg-danger';
}

function stateClass(state: number): string {
    if (state === NodeStateEnum.CONNECTED) return 'bg-online/15 text-online';
    if (state === NodeStateEnum.CONNECTING || state === NodeStateEnum.RECONNECTING) return 'bg-warning/15 text-warning';
    return 'bg-danger/15 text-danger';
}

function stateName(state: number): string {
    const states = [
        t('nodes.state.connecting'),
        t('nodes.state.connected'),
        t('nodes.state.disconnected'),
        t('nodes.state.reconnecting'),
    ];
    return states[state] ?? t('nodes.state.unknown');
}

function nodeInfo(node: NodeStatus): NodeInfoData | null {
    return (node.info as NodeInfoData) ?? null;
}

function nodeStats(node: NodeStatus): NodeStatsData | null {
    return (node.stats as NodeStatsData) ?? null;
}

function cpuSystemPercent(node: NodeStatus): number {
    const load = nodeStats(node)?.cpu?.systemLoad;
    return load !== undefined ? load * 100 : 0;
}

function cpuLavalinkPercent(node: NodeStatus): number {
    const load = nodeStats(node)?.cpu?.lavalinkLoad;
    return load !== undefined ? load * 100 : 0;
}

function memPercent(node: NodeStatus): number {
    const mem = nodeStats(node)?.memory;
    if (!mem?.used || !mem?.reservable) return 0;
    return Math.round((mem.used / mem.reservable) * 100);
}

function memLabel(node: NodeStatus): string {
    const mem = nodeStats(node)?.memory;
    if (!mem?.used || !mem?.reservable) return '';
    const usedMb = (mem.used / 1024 / 1024).toFixed(0);
    const reservableGb = (mem.reservable / 1024 / 1024 / 1024).toFixed(1);
    return `${usedMb} MB / ${reservableGb} GB`;
}

/** Formats uptime in milliseconds to a human-readable string (e.g. "84d 22h"). */
function formatUptime(ms?: number): string {
    if (ms === undefined) return '—';
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

/** Formats a Unix timestamp (ms) to a short date string. */
function formatBuildDate(ts?: number): string {
    if (ts === undefined) return '—';
    return new Date(ts).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
</script>
