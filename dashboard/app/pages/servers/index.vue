<template>
    <!-- Full-height flex column: header + filters are fixed, only the grid scrolls -->
    <div class="flex h-full flex-col gap-3">
        <!-- Header -->
        <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
                <h1 class="font-display text-xl font-extrabold tracking-wide text-snow">{{ $t('common.servers') }}</h1>
                <p class="mt-1 text-sm text-sub">{{ $t('servers.desc') }}</p>
            </div>
            <span class="rounded-full bg-surface px-3 py-1 text-xs text-fog">
                {{ $t('localnode.total', { count: serversStore.pagination.totalItems }) }}
            </span>
        </div>

        <!-- Filters -->
        <div class="rounded-2xl bg-panel p-4 shadow">
            <form class="flex flex-wrap items-end gap-3" @submit.prevent="applyFilters">
                <div class="flex min-w-60 flex-col gap-1.5">
                    <span class="text-[11px] font-semibold tracking-wide text-muted">Guild ID</span>
                    <input
                        v-model="guildIdInput"
                        class="w-full rounded-lg border border-line bg-input-bg px-4 py-2 text-sm text-snow outline-none placeholder:text-muted focus:border-blurple"
                        inputmode="numeric"
                        :placeholder="$t('servers.idPlaceholder')"
                    />
                </div>
                <div class="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        class="rounded-xl px-4 py-2 text-sm font-medium transition"
                        :class="
                            serversStore.playingFilter
                                ? 'bg-online/20 text-online'
                                : 'bg-hover text-sub hover:text-snow'
                        "
                        @click="togglePlayingFilter"
                    >
                        <Icon name="lucide:music" class="mr-1.5 inline size-3.5" />
                        {{ serversStore.playingFilter ? $t('servers.playingOnly') : $t('servers.allStates') }}
                    </button>
                    <button
                        type="submit"
                        class="rounded-xl bg-blurple px-4 py-2 text-sm font-semibold text-white transition hover:bg-blurple-dark"
                    >
                        {{ $t('common.apply') }}
                    </button>
                    <button
                        type="button"
                        class="rounded-xl bg-hover px-4 py-2 text-sm font-medium text-sub transition hover:text-snow"
                        @click="clearFilters"
                    >
                        {{ $t('localnode.clear') }}
                    </button>
                </div>
            </form>
        </div>

        <!-- Scrollable content area: only this section scrolls -->
        <div class="min-h-0 flex-1 overflow-y-auto">
            <!-- Loading skeleton -->
            <div v-if="serversStore.loading" class="flex h-full min-h-50 items-center justify-center">
                <span class="inline-block size-8 animate-spin rounded-full border-[3px] border-line border-t-blurple" />
            </div>

            <!-- Empty state -->
            <div
                v-else-if="serversStore.items.length === 0"
                class="flex h-full min-h-50 items-center justify-center rounded-2xl bg-panel p-10 text-center text-muted"
            >
                {{ $t('servers.emptyServers') }}
            </div>

            <!-- Server grid -->
            <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3 pb-1">
                <NuxtLink
                    v-for="server in serversStore.items"
                    :key="server.id"
                    :to="`/servers/${server.id}`"
                    class="group flex items-center gap-3 rounded-2xl bg-panel p-4 shadow transition hover:bg-hover"
                >
                    <!-- Server icon -->
                    <div class="relative shrink-0">
                        <img
                            v-if="server.iconUrl"
                            :src="server.iconUrl"
                            :alt="server.name"
                            class="size-13 rounded-full object-cover"
                        />
                        <div
                            v-else
                            class="flex size-13 items-center justify-center rounded-full bg-blurple text-lg font-extrabold text-white"
                        >
                            {{ server.name.charAt(0).toUpperCase() }}
                        </div>
                        <!-- Playing indicator dot -->
                        <span
                            v-if="server.isPlaying"
                            class="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-panel bg-online"
                            title="Music playing"
                        />
                    </div>

                    <!-- Server info -->
                    <div class="min-w-0 flex-1">
                        <p class="truncate text-[15px] font-semibold text-snow">{{ server.name }}</p>
                        <p class="text-xs text-muted">{{ $t('servers.memberCount', { count: server.memberCount ?? 0 }) }}</p>
                        <p class="text-xs text-muted">{{ $t('servers.shardId', { id: server.shardId }) }}</p>
                        <p class="truncate font-mono text-[11px] text-muted">{{ server.id }}</p>
                    </div>

                    <!-- Playback status badge -->
                    <span
                        class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
                        :class="server.isPlaying ? 'bg-online/15 text-online' : 'bg-line/50 text-muted'"
                    >
                        {{ server.isPlaying ? $t('servers.playing') : $t('servers.idle') }}
                    </span>
                </NuxtLink>
            </div>
        </div>

        <!-- Pagination: fixed at bottom, never scrolls -->
        <div class="shrink-0">
            <PaginationControls
                :page="serversStore.page"
                :total-pages="serversStore.pagination.totalPages"
                :disabled="serversStore.loading"
                @change="changePage"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
const serversStore = useServersStore();
const guildIdInput = ref(serversStore.guildIdFilter);

onMounted(() => {
    if (serversStore.isStale) {
        serversStore.fetch();
    }
});

async function applyFilters(): Promise<void> {
    serversStore.setFilters({ guildId: guildIdInput.value.trim(), playing: serversStore.playingFilter });
    await serversStore.fetch();
}

async function clearFilters(): Promise<void> {
    guildIdInput.value = '';
    serversStore.setFilters({ guildId: '', playing: undefined });
    await serversStore.fetch();
}

async function togglePlayingFilter(): Promise<void> {
    serversStore.setFilters({
        guildId: guildIdInput.value.trim(),
        playing: serversStore.playingFilter ? undefined : true,
    });
    await serversStore.fetch();
}

async function changePage(nextPage: number): Promise<void> {
    serversStore.setPage(nextPage);
    await serversStore.fetch();
}
</script>
