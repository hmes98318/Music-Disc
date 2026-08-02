<template>
    <div>
        <!-- Back nav + refresh indicator -->
        <div class="mb-6 flex items-center justify-between">
            <NuxtLink to="/servers" class="flex items-center gap-1.5 text-sm text-sub transition hover:text-snow">
                <Icon name="lucide:arrow-left" class="size-4" />
                {{ $t('servers.details.backToServers') }}
            </NuxtLink>
            <div class="flex items-center gap-2">
                <span
                    v-if="refreshing"
                    class="inline-block size-3.5 animate-spin rounded-full border-2 border-line border-t-blurple"
                />
                <span
                    v-if="!isNotFound"
                    class="rounded-full bg-blurple/15 px-3 py-1 text-xs font-medium text-blurple-light"
                >
                    {{ $t('index.refreshIn', { countdown }) }}
                </span>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex min-h-80 items-center justify-center">
            <span class="inline-block size-8 animate-spin rounded-full border-[3px] border-line border-t-blurple" />
        </div>

        <!-- Error / not found -->
        <div
            v-else-if="!server"
            class="flex flex-col items-center justify-center rounded-2xl bg-panel px-8 py-16 text-center"
        >
            <Icon :name="isNotFound ? 'lucide:server-off' : 'lucide:circle-alert'" class="mb-4 size-12 text-muted" />
            <h2 class="mb-2 text-lg font-semibold text-snow">
                {{ isNotFound ? $t('servers.details.notFoundTitle') : $t('servers.details.loadFailedTitle') }}
            </h2>
            <p class="text-sm text-muted">
                {{
                    isNotFound
                        ? $t('servers.details.notFoundDesc', { id: guildId })
                        : loadError
                }}
            </p>
            <NuxtLink
                v-if="isNotFound"
                to="/servers"
                class="mt-6 rounded-xl bg-blurple px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blurple-dark"
            >
                {{ $t('servers.details.backToServers') }}
            </NuxtLink>
        </div>

        <template v-else>
            <!-- Server header card -->
            <div class="mb-6 flex flex-wrap items-center gap-5 rounded-2xl bg-panel p-8 shadow">
                <img
                    v-if="server.guild.iconUrl"
                    :src="server.guild.iconUrl"
                    :alt="server.guild.name"
                    class="size-18 rounded-full object-cover"
                />
                <div
                    v-else
                    class="flex size-18 items-center justify-center rounded-full bg-blurple text-2xl font-extrabold text-white"
                >
                    {{ server.guild.name.charAt(0).toUpperCase() }}
                </div>

                <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-3">
                        <h1 class="font-display text-2xl font-extrabold text-snow">{{ server.guild.name }}</h1>
                        <span class="rounded-full px-2.5 py-0.5 text-xs font-semibold" :class="playbackBadgeClass">
                            {{ playbackLabel }}
                        </span>
                    </div>
                    <p class="mt-1 text-sm text-sub">
                        {{ $t('servers.details.guildId', { id: server.guild.id }) }} · {{ $t('servers.memberCount', { count: server.guild.memberCount ?? 0 }) }}
                        · {{ $t('servers.shardId', { id: server.guild.shardId }) }}
                    </p>
                    <p class="text-xs text-muted">
                        {{ $t('servers.details.owner') }} {{ server.guild.ownerId }} · {{ $t('servers.details.preferredLocale') }} {{ server.guild.preferredLocale }}
                    </p>
                </div>

                <button
                    class="shrink-0 rounded-xl bg-danger px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-85"
                    @click="handleLeave"
                >
                    {{ $t('servers.details.leaveServer') }}
                </button>
            </div>

            <!-- Snapshot + Counts grid -->
            <div class="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <!-- Guild snapshot -->
                <div class="rounded-2xl bg-panel p-8 shadow">
                    <h2 class="mb-4 text-[13px] font-semibold tracking-wide text-muted">{{ $t('servers.details.snapshot') }}</h2>
                    <ul class="flex flex-col gap-2.5">
                        <li class="flex justify-between text-sm">
                            <span class="text-muted">{{ $t('servers.details.createdAt') }}</span>
                            <span class="font-medium text-snow">{{ createdAtLabel }}</span>
                        </li>
                        <li class="flex justify-between text-sm">
                            <span class="text-muted">{{ $t('servers.details.joinedAt') }}</span>
                            <span class="font-medium text-snow">{{ joinedAtLabel }}</span>
                        </li>
                        <li class="flex justify-between text-sm">
                            <span class="text-muted">{{ $t('servers.details.botNickname') }}</span>
                            <span class="font-medium text-snow">{{ server.botMember.nickname ?? '-' }}</span>
                        </li>
                        <li class="flex justify-between text-sm">
                            <span class="text-muted">{{ $t('servers.details.features') }}</span>
                            <span class="font-medium text-snow">{{ server.guild.features.length }}</span>
                        </li>
                    </ul>
                    <div v-if="server.guild.features.length > 0" class="mt-4 flex flex-wrap gap-2">
                        <span
                            v-for="feature in server.guild.features"
                            :key="feature"
                            class="rounded-full bg-blurple/15 px-2.5 py-0.5 text-xs text-blurple-light"
                        >
                            {{ feature }}
                        </span>
                    </div>
                </div>

                <!-- Counts & channels -->
                <div class="rounded-2xl bg-panel p-8 shadow">
                    <h2 class="mb-4 text-[13px] font-semibold tracking-wide text-muted">{{ $t('servers.details.countsAndChannels') }}</h2>
                    <div class="mb-4 grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-[11px] font-semibold tracking-wide text-muted">{{ $t('servers.details.channels') }}</p>
                            <p class="text-2xl font-bold text-snow">{{ server.guild.counts.channels }}</p>
                        </div>
                        <div>
                            <p class="text-[11px] font-semibold tracking-wide text-muted">{{ $t('servers.details.text') }}</p>
                            <p class="text-2xl font-bold text-snow">{{ server.guild.counts.textChannels }}</p>
                        </div>
                        <div>
                            <p class="text-[11px] font-semibold tracking-wide text-muted">{{ $t('servers.details.voice') }}</p>
                            <p class="text-2xl font-bold text-snow">{{ server.guild.counts.voiceChannels }}</p>
                        </div>
                        <div>
                            <p class="text-[11px] font-semibold tracking-wide text-muted">{{ $t('servers.details.roles') }}</p>
                            <p class="text-2xl font-bold text-snow">{{ server.guild.counts.roles }}</p>
                        </div>
                    </div>
                    <ul class="flex flex-col gap-2">
                        <li class="flex justify-between text-sm">
                            <span class="text-muted">{{ $t('servers.details.systemChannel') }}</span>
                            <span class="font-medium text-snow">{{ channelLabel(server.guild.channels.system) }}</span>
                        </li>
                        <li class="flex justify-between text-sm">
                            <span class="text-muted">{{ $t('servers.details.rulesChannel') }}</span>
                            <span class="font-medium text-snow">{{ channelLabel(server.guild.channels.rules) }}</span>
                        </li>
                        <li class="flex justify-between text-sm">
                            <span class="text-muted">{{ $t('servers.details.updatesChannel') }}</span>
                            <span class="font-medium text-snow">{{
                                channelLabel(server.guild.channels.publicUpdates)
                            }}</span>
                        </li>
                        <li class="flex justify-between text-sm">
                            <span class="text-muted">{{ $t('servers.details.afkChannel') }}</span>
                            <span class="font-medium text-snow">{{ channelLabel(server.guild.channels.afk) }}</span>
                        </li>
                    </ul>
                </div>
            </div>

            <!-- Playback + Voice snapshot -->
            <div class="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <!-- Playback -->
                <div class="rounded-2xl bg-panel p-8 shadow">
                    <div class="mb-4 flex items-center justify-between">
                        <h2 class="text-[13px] font-semibold tracking-wide text-muted">{{ $t('servers.details.playback') }}</h2>
                        <span class="rounded-full px-2.5 py-0.5 text-xs font-semibold" :class="playbackBadgeClass">
                            {{ playbackLabel }}
                        </span>
                    </div>

                    <template v-if="server.playback.active && server.playback.currentTrack">
                        <div class="flex gap-4">
                            <img
                                v-if="thumbnailUrl"
                                :src="thumbnailUrl"
                                alt="Track thumbnail"
                                class="size-20 shrink-0 rounded-lg object-cover"
                            />
                            <div class="min-w-0 flex-1">
                                <a
                                    :href="server.playback.currentTrack.url"
                                    target="_blank"
                                    class="block truncate text-sm font-semibold text-snow hover:underline"
                                >
                                    {{ server.playback.currentTrack.title }}
                                </a>
                                <p class="text-xs text-sub">{{ server.playback.currentTrack.author }}</p>
                                <div class="mt-2 flex flex-wrap gap-1.5">
                                    <span class="rounded-full bg-blurple/15 px-2.5 py-0.5 text-xs text-blurple-light">
                                        {{ server.playback.currentTrack.sourceName }}
                                    </span>
                                    <span class="rounded-full bg-surface px-2.5 py-0.5 text-xs text-sub">
                                        {{ formatDuration(server.playback.currentTrack.durationMs) }}
                                    </span>
                                    <span class="rounded-full bg-surface px-2.5 py-0.5 text-xs text-sub">
                                        Vol {{ server.playback.volume.current ?? '-' }}/{{ server.playback.volume.max }}
                                    </span>
                                    <span class="rounded-full bg-surface px-2.5 py-0.5 text-xs text-sub">
                                        Loop {{ server.playback.repeatMode }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </template>

                    <div v-else class="flex min-h-20 items-center justify-center text-sm text-muted">
                        {{ $t('servers.details.emptyPlayback') }}
                    </div>
                </div>

                <!-- Voice snapshot -->
                <div class="rounded-2xl bg-panel p-8 shadow">
                    <h2 class="mb-4 text-[13px] font-semibold tracking-wide text-muted">{{ $t('servers.details.voiceSnapshot') }}</h2>

                    <template v-if="server.voiceChannel">
                        <p class="mb-4 text-sm font-medium text-snow">
                            {{ server.voiceChannel.name }} · {{ server.voiceChannel.memberCount }} connected
                        </p>

                        <div class="flex flex-col gap-3">
                            <div
                                v-for="member in server.voiceChannel.members"
                                :key="member.id"
                                class="flex items-center gap-3"
                            >
                                <img
                                    :src="member.avatarUrl"
                                    :alt="member.displayName"
                                    class="size-9 rounded-full object-cover"
                                />
                                <div class="min-w-0 flex-1">
                                    <p class="truncate text-sm font-medium text-snow">{{ member.displayName }}</p>
                                    <p class="truncate text-xs text-muted">{{ member.username }}</p>
                                </div>
                                <div class="flex items-center gap-1.5">
                                    <!-- Bot tag — keep as text badge per Discord convention -->
                                    <span
                                        v-if="member.isBot"
                                        class="rounded bg-warning/15 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-warning"
                                        >BOT</span
                                    >
                                    <!--
                                        Voice status icons:
                                        - Deafened takes priority (implies muted); show only deafened icon.
                                        - Muted-only shown when deafened is false.
                                    -->
                                    <IconsDiscordDeafened
                                        v-if="member.isDeafened"
                                        class="size-4 text-danger"
                                        title="Deafened"
                                    />
                                    <IconsDiscordMuted
                                        v-else-if="member.isMuted"
                                        class="size-4 text-danger"
                                        title="Muted"
                                    />
                                    <Icon
                                        v-if="member.isStreaming"
                                        name="lucide:cast"
                                        class="size-4 text-online"
                                        title="Streaming"
                                    />
                                    <Icon
                                        v-if="member.hasVideo"
                                        name="lucide:video"
                                        class="size-4 text-online"
                                        title="Video"
                                    />
                                </div>
                            </div>
                        </div>
                    </template>

                    <div v-else class="flex min-h-20 items-center justify-center text-sm text-muted">
                        {{ $t('servers.details.emptyVoice') }}
                    </div>
                </div>
            </div>

            <!-- Capabilities -->
            <div class="rounded-2xl bg-panel p-8 shadow">
                <h2 class="mb-4 text-[13px] font-semibold tracking-wide text-muted">{{ $t('servers.details.capabilities') }}</h2>
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div
                        v-for="cap in capabilities"
                        :key="cap.label"
                        class="flex items-center justify-between rounded-xl bg-surface px-4 py-3"
                    >
                        <span class="text-sm text-sub">{{ cap.label }}</span>
                        <span
                            class="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                            :class="cap.value ? 'bg-online/15 text-online' : 'bg-danger/15 text-danger'"
                        >
                            {{ cap.value ? $t('servers.details.available') : $t('servers.details.unavailable') }}
                        </span>
                    </div>
                </div>
                <ul class="mt-4 flex flex-col gap-1.5">
                    <li class="flex items-start gap-2 text-xs text-sub">
                        <Icon name="lucide:info" class="mt-px size-3 shrink-0 text-info" />
                        {{ $t('servers.details.capabilitiesDesc') }}
                    </li>
                </ul>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { ApiError } from '~/composables/useApi';
import { useConfirm } from '~/composables/useConfirm';
import type { ChannelReference, ServerDetail, ServerTrack } from '~/composables/useApi';

const route = useRoute();
const router = useRouter();
const api = useApi();
const { alert, confirm } = useConfirm();
const { t } = useI18n();

const server = ref<ServerDetail | null>(null);
const thumbnailUrl = ref('');
const loading = ref(true);
const refreshing = ref(false);
const loadError = ref('');
const isNotFound = ref(false);

const guildId = computed(() => {
    const id = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id;
    return id ?? '';
});

const createdAtLabel = computed(() => formatISODateTime(server.value?.guild.createdAt));

const joinedAtLabel = computed(() => formatISODateTime(server.value?.botMember.joinedAt));

const playbackLabel = computed(() => {
    const s = server.value?.playback.status ?? 'idle';
    if (s === 'playing') return t('servers.playing');
    if (s === 'paused') return t('servers.paused');
    return t('servers.idle');
});

const playbackBadgeClass = computed(() => {
    const s = server.value?.playback.status;
    if (s === 'playing') return 'bg-online/15 text-online';
    if (s === 'paused') return 'bg-warning/15 text-warning';
    return 'bg-line/50 text-muted';
});

const capabilities = computed(() => {
    if (!server.value) return [];
    return [
        { label: t('servers.details.voiceStateSnapshot'), value: server.value.capabilities.voiceMemberSnapshot },
        { label: t('servers.details.messageContent'), value: server.value.capabilities.messageContent },
    ];
});

// Skip refresh once the guild is confirmed not found — no need to keep retrying.
const { countdown } = useAutoRefresh(10_000, () => (isNotFound.value ? undefined : fetchServer(false)), {
    immediate: false,
});

onMounted(() => fetchServer(true));

async function fetchServer(showLoader: boolean): Promise<void> {
    if (showLoader || !server.value) {
        loading.value = true;
    } else {
        refreshing.value = true;
    }

    try {
        const detail = await api.getServer(guildId.value);
        server.value = detail;
        thumbnailUrl.value = await resolveThumbnail(detail.playback.currentTrack);
        loadError.value = '';
        isNotFound.value = false;
    } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
            server.value = null;
            thumbnailUrl.value = '';
            isNotFound.value = true;
            loadError.value = '';
            return;
        }
        if (!server.value || showLoader) {
            server.value = null;
            thumbnailUrl.value = '';
            loadError.value = t('servers.details.loadFailedDesc');
        }
    } finally {
        loading.value = false;
        refreshing.value = false;
    }
}

async function resolveThumbnail(track: ServerTrack | null): Promise<string> {
    if (!track || track.sourceName !== 'youtube') return '';

    try {
        return (await api.getThumbnailUrl('youtube', track.identifier)).url;
    } catch {
        return '';
    }
}

async function handleLeave(): Promise<void> {
    const confirmed = await confirm({
        title: t('servers.details.leaveServer'),
        message: t('servers.details.leaveConfirm', { name: server.value?.guild.name }),
        confirmLabel: t('servers.details.leaveServer'),
        cancelLabel: t('common.cancel'),
    });

    if (!confirmed) return;

    try {
        await api.deleteServer(guildId.value);
        await router.push('/servers');
    } catch {
        await alert({ title: t('servers.details.leaveFailedTitle'), message: t('servers.details.leaveFailedDesc') });
    }
}

function channelLabel(channel: ChannelReference | null): string {
    return channel ? channel.name : t('servers.details.notConfigured');
}

function formatDuration(durationMs: number): string {
    const total = Math.max(Math.floor(durationMs / 1000), 0);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;

    if (h > 0) {
        return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    return `${m}:${String(s).padStart(2, '0')}`;
}
</script>
