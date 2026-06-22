<template>
    <div class="w-full max-w-[400px] rounded-2xl bg-panel p-12 shadow-xl">
        <!-- Brand -->
        <div class="mb-8 flex flex-col items-center gap-3 text-center">
            <img src="/imgs/logo/logo2.svg" alt="Music Disc Logo" class="size-16 rounded-lg" />
            <h1 class="font-display text-3xl font-extrabold tracking-tight text-snow">Music Disc</h1>
        </div>

        <!-- Page loading -->
        <div v-if="pageLoading" class="flex min-h-[180px] items-center justify-center">
            <span class="inline-block size-8 animate-spin rounded-full border-[3px] border-line border-t-blurple" />
        </div>

        <!-- OAuth2 login -->
        <template v-else-if="loginMode === 'oauth2'">
            <button
                type="button"
                class="flex w-full items-center justify-center gap-3 rounded-xl bg-blurple px-4 py-3.5 text-[15px] font-semibold text-white transition hover:bg-blurple-dark disabled:opacity-50"
                :disabled="loading"
                @click="handleOAuth2Login"
            >
                <svg viewBox="0 0 24 24" class="size-5 shrink-0" fill="currentColor">
                    <path
                        d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.101 18.079.11 18.1.128 18.115a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"
                    />
                </svg>
                <span
                    v-if="loading"
                    class="inline-block size-[18px] animate-spin rounded-full border-2 border-white/30 border-t-white"
                />
                <span v-else>{{ $t('login.loginWithDiscord') }}</span>
            </button>
            <p v-if="errorMsg" class="mt-3 text-center text-sm text-danger">{{ errorMsg }}</p>
        </template>

        <!-- Credentials login -->
        <template v-else>
            <form class="flex flex-col gap-4" @submit.prevent="handleLogin">
                <div class="flex flex-col gap-2">
                    <label class="text-[13px] font-medium text-sub" for="username">{{ $t('login.username') }}</label>
                    <input
                        id="username"
                        v-model="username"
                        type="text"
                        class="w-full rounded-lg border border-line bg-input-bg px-4 py-2.5 text-base text-snow outline-none placeholder:text-muted focus:border-blurple"
                        :placeholder="$t('login.username')"
                        autocomplete="username"
                        required
                    />
                </div>

                <div class="flex flex-col gap-2">
                    <label class="text-[13px] font-medium text-sub" for="password">{{ $t('login.password') }}</label>
                    <input
                        id="password"
                        v-model="password"
                        type="password"
                        class="w-full rounded-lg border border-line bg-input-bg px-4 py-2.5 text-base text-snow outline-none placeholder:text-muted focus:border-blurple"
                        :placeholder="$t('login.password')"
                        autocomplete="current-password"
                        required
                    />
                </div>

                <p v-if="errorMsg" class="text-center text-sm text-danger">{{ errorMsg }}</p>

                <button
                    type="submit"
                    class="mt-2 flex w-full items-center justify-center rounded-xl bg-blurple px-4 py-3.5 text-[15px] font-semibold text-white transition hover:bg-blurple-dark disabled:opacity-50"
                    :disabled="loading"
                >
                    <span
                        v-if="loading"
                        class="inline-block size-[18px] animate-spin rounded-full border-2 border-white/30 border-t-white"
                    />
                    <span v-else>{{ $t('login.signIn') }}</span>
                </button>
            </form>
        </template>
    </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { ApiError } from '~/composables/useApi';

definePageMeta({ layout: 'auth' });

const api = useApi();
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { t } = useI18n();

const pageLoading = ref(true);
const loginMode = ref<'credentials' | 'oauth2'>('credentials');
const username = ref('');
const password = ref('');
const errorMsg = ref('');
const loading = ref(false);

onMounted(async () => {
    try {
        const session = await api.getSession();
        if (session.authenticated) {
            authStore.setAuthenticated(true);
            router.replace('/');
            return;
        }
    } catch (_) {
        /* not logged in — continue */
    }

    const oauth2Error = Array.isArray(route.query.oauth2Error) ? route.query.oauth2Error[0] : route.query.oauth2Error;
    if (oauth2Error) errorMsg.value = oauth2ErrorMessage(oauth2Error ?? '');

    try {
        const config = await api.getAuthConfig();
        loginMode.value = config.loginMode;
    } catch {
        errorMsg.value = t('login.configLoadFailed');
    } finally {
        pageLoading.value = false;
    }
});

async function handleLogin() {
    errorMsg.value = '';
    loading.value = true;
    try {
        await api.createSession(username.value, password.value);
        authStore.setAuthenticated(true);
        router.replace('/');
    } catch (error) {
        if (error instanceof ApiError && error.status === 429) {
            errorMsg.value = t('login.ipBlocked');
        } else if (error instanceof ApiError && error.isUnauthorized) {
            errorMsg.value = t('login.invalidCredentials');
        } else {
            errorMsg.value = t('login.loginFailed');
        }
    } finally {
        loading.value = false;
    }
}

async function handleOAuth2Login() {
    errorMsg.value = '';
    loading.value = true;
    try {
        const authorization = await api.createOAuth2AuthorizationUrl();
        window.location.assign(authorization.oauth2AuthorizationUrl);
    } catch (error) {
        errorMsg.value =
            error instanceof ApiError && error.detail ? error.detail : t('login.discordLoginUnable');
    } finally {
        loading.value = false;
    }
}

function oauth2ErrorMessage(code: string): string {
    const messages: Record<string, string> = {
        blocked: t('login.oauth2.blocked'),
        state_invalid: t('login.oauth2.state_invalid'),
        code_missing: t('login.oauth2.code_missing'),
        bot_not_ready: t('login.oauth2.bot_not_ready'),
        exchange_failed: t('login.oauth2.exchange_failed'),
        admin_required: t('login.oauth2.admin_required'),
        user_fetch_failed: t('login.oauth2.user_fetch_failed'),
    };
    return messages[code] ?? t('login.oauth2.unexpected');
}
</script>
