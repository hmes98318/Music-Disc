export interface QueueTableRow {
    guild_id: string;
    voice_channel_id: string;
    text_channel_id: string;
    tracks: string;
    current_track_index: number;
    volume: number;
    repeat_mode: number;
    paused: number;
    position: number;
    timestamp: number;
}

export interface GuildVolumeTableRow {
    guild_id: string;
    volume: number;
}

export interface GuildLanguageTableRow {
    guild_id: string;
    language: string;
}

export interface BlacklistedUserTableRow {
    user_id: string;
}

