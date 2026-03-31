import type { VoiceBasedChannel } from 'discord.js';
import type { BlacklistManager } from '../../lib/BlacklistManager.js';

const isUserInBlacklist = (voiceChannel: VoiceBasedChannel | null | undefined, blacklist: string[], blacklistManager?: BlacklistManager) => {
    if (!voiceChannel) {
        return [];
    }

    const voiceMembers = voiceChannel.members;
    const blacklistedUsers = [];

    for (const member of voiceMembers.values()) {
        const inStaticList = blacklist.includes(member.user.id);
        const inDynamicList = blacklistManager?.has(member.user.id) ?? false;
        if (inStaticList || inDynamicList) {
            blacklistedUsers.push({ name: member.user.username, value: member.user.id });
        }
    }

    return blacklistedUsers;
};

export { isUserInBlacklist };
