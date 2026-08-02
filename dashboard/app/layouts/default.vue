<template>
    <!-- h-screen + overflow-hidden creates an app-shell: viewport is fixed, each page controls its own scrolling -->
    <div class="flex h-screen overflow-hidden bg-bg">
        <!-- Sidebar -->
        <nav class="sticky top-0 flex h-screen w-[240px] min-w-[240px] flex-col overflow-y-auto bg-surface">
            <!-- Brand -->
            <div class="flex items-center gap-3 px-6 py-5 mb-2">
                <img src="/imgs/logo/logo2.svg" alt="Music Disc" class="size-9 rounded-lg" />
                <span class="font-display text-lg font-extrabold tracking-tight text-snow">Music Disc</span>
            </div>

            <!-- Nav links -->
            <ul class="flex flex-1 flex-col gap-0.5 px-3 py-1">
                <li>
                    <NuxtLink
                        to="/"
                        class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-sub transition hover:bg-hover hover:text-snow"
                        active-class="!bg-blurple/20 !text-blurple-light"
                        exact
                    >
                        <Icon name="lucide:layout-dashboard" class="size-[18px] shrink-0" />
                        {{ $t('common.dashboard') }}
                    </NuxtLink>
                </li>
                <li>
                    <NuxtLink
                        to="/servers"
                        class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-sub transition hover:bg-hover hover:text-snow"
                        active-class="!bg-blurple/20 !text-blurple-light"
                    >
                        <Icon name="lucide:server" class="size-[18px] shrink-0" />
                        {{ $t('common.servers') }}
                    </NuxtLink>
                </li>
                <li>
                    <NuxtLink
                        to="/nodes"
                        class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-sub transition hover:bg-hover hover:text-snow"
                        active-class="!bg-blurple/20 !text-blurple-light"
                    >
                        <Icon name="lucide:activity" class="size-[18px] shrink-0" />
                        {{ $t('common.nodes') }}
                    </NuxtLink>
                </li>
                <li>
                    <NuxtLink
                        to="/localnode"
                        class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-sub transition hover:bg-hover hover:text-snow"
                        active-class="!bg-blurple/20 !text-blurple-light"
                    >
                        <Icon name="lucide:cpu" class="size-[18px] shrink-0" />
                        {{ $t('common.localNode') }}
                    </NuxtLink>
                </li>
                <li>
                    <NuxtLink
                        to="/logs"
                        class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-sub transition hover:bg-hover hover:text-snow"
                        active-class="!bg-blurple/20 !text-blurple-light"
                    >
                        <Icon name="lucide:file-text" class="size-[18px] shrink-0" />
                        {{ $t('common.logs') }}
                    </NuxtLink>
                </li>
                <li>
                    <NuxtLink
                        to="/maintenance"
                        class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-sub transition hover:bg-hover hover:text-snow"
                        active-class="!bg-blurple/20 !text-blurple-light"
                    >
                        <Icon name="lucide:wrench" class="size-[18px] shrink-0" />
                        {{ $t('common.maintenance') }}
                    </NuxtLink>
                </li>
            </ul>

            <!-- Language Selector -->
            <div class="px-4 py-2 border-t border-line">
                <div class="flex items-center gap-2 rounded-xl bg-hover px-3 py-2">
                    <Icon name="lucide:languages" class="size-4 text-sub" />
                    <select
                        v-model="currentLocale"
                        class="w-full bg-transparent text-sm font-medium text-snow focus:outline-none cursor-pointer"
                    >
                        <option
                            v-for="loc in locales"
                            :key="loc.code"
                            :value="loc.code"
                            class="bg-surface text-snow"
                        >
                            {{ loc.name }}
                        </option>
                    </select>
                </div>
            </div>

            <!-- Logout -->
            <div class="px-4 py-4">
                <button
                    class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-hover px-4 py-2 text-sm font-medium text-sub transition hover:bg-danger/15 hover:text-danger active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="loggingOut"
                    @click="handleLogout"
                >
                    <Icon name="lucide:log-out" class="size-4" />
                    {{ $t('common.logout') }}
                </button>
            </div>
        </nav>

        <!-- Main content -->
        <main class="min-w-0 flex-1 overflow-y-auto p-8">
            <slot />
        </main>

        <!-- Global confirmation / alert dialog -->
        <ConfirmModal />
    </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const api = useApi();
const router = useRouter();
const authStore = useAuthStore();
const botStore = useBotStore();
const { locale, locales, setLocale } = useI18n();

const loggingOut = ref(false);

const currentLocale = computed({
    get: () => locale.value,
    set: (val) => {
        setLocale(val);
    }
});

// defaultLocale 동기화
watch(() => botStore.summary?.i18n?.defaultLocale, (newDefault) => {
    if (newDefault) {
        const i18nCookie = useCookie('i18n_redirected');
        if (!i18nCookie.value) {
            setLocale(newDefault);
        }
    }
}, { immediate: true });

async function handleLogout() {
    loggingOut.value = true;
    try {
        await api.deleteSession();
    } catch (_) {
        // Ignore errors — redirect regardless
    } finally {
        loggingOut.value = false;
    }
    authStore.setAuthenticated(false);
    router.push('/login');
}
</script>
