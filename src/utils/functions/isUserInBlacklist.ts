import type { VoiceBasedChannel } from "discord.js";

const isUserInBlacklist = (voiceChannel: VoiceBasedChannel | null | undefined, blacklist: string[]) => {
    if (!voiceChannel) {
        return [];
    }

    const voiceMembers = voiceChannel.members;
    const blacklistedUsers = [];

    for (const member of voiceMembers.values()) {
        if (blacklist.includes(member.user.id)) {
            blacklistedUsers.push({ name: member.user.username, value: member.user.id });
        }
    }

    return blacklistedUsers;
};

export { isUserInBlacklist };