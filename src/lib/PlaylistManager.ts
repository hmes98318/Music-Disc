import type { Database } from 'better-sqlite3';
import type { Bot } from '../@types/index.js';


export const PLAYLIST_TRACK_LIMIT = 500;

export interface PlaylistTrack {
    id?: number;
    playlistId?: number;
    title: string;
    url: string;
    encoded?: string | null;
    author?: string | null;
    duration?: number | null;
    position: number;
}

export interface Playlist {
    id: number;
    guildId: string;
    name: string;
    createdAt: number;
    tracks?: PlaylistTrack[];
}

export type PlaylistImportResult =
    | {success: true; trackCount: number}
    | {success: false; reason: 'EMPTY' | 'SAVE_FAILED' | 'TRACK_LIMIT'};

export class PlaylistManager {
    private readonly bot: Bot;

    constructor(bot: Bot) {
        this.bot = bot;
    }

    private get db(): Database | null {
        return this.bot.databaseManager?.getDatabase() || null;
    }

    public createPlaylist(guildId: string, name: string): number | null {
        const db = this.db;
        if (!db) return null;

        try {
            const stmt = db.prepare(`
                INSERT INTO playlists (guild_id, name, created_at)
                VALUES (?, ?, ?)
            `);
            const info = stmt.run(guildId, name, Date.now());
            return info.lastInsertRowid as number;
        } catch (error) {
            this.bot.logger.error(this.bot.shardId, `[PlaylistManager] Error creating playlist ${name}: ${error}`);
            return null;
        }
    }

    public getPlaylist(guildId: string, name: string): Playlist | null {
        const db = this.db;
        if (!db) return null;

        try {
            const playlistRow = db.prepare(`
                SELECT id, guild_id as guildId, name, created_at as createdAt
                FROM playlists
                WHERE guild_id = ? AND name = ?
            `).get(guildId, name) as Playlist | undefined;

            if (!playlistRow) return null;

            const tracks = db.prepare(`
                SELECT id, playlist_id as playlistId, title, url, encoded, author, duration, position
                FROM playlist_tracks
                WHERE playlist_id = ?
                ORDER BY position ASC
            `).all(playlistRow.id) as any[];

            playlistRow.tracks = tracks.map(t => ({
                id: t.id,
                playlistId: t.playlistId,
                title: t.title,
                url: t.url,
                encoded: t.encoded,
                author: t.author,
                duration: t.duration,
                position: t.position
            }));

            return playlistRow;
        } catch (error) {
            this.bot.logger.error(this.bot.shardId, `[PlaylistManager] Error getting playlist ${name}: ${error}`);
            return null;
        }
    }

    public deletePlaylist(guildId: string, name: string): boolean {
        const db = this.db;
        if (!db) return false;

        try {
            const playlist = this.getPlaylist(guildId, name);
            if (!playlist) return false;

            db.prepare('DELETE FROM playlists WHERE id = ?').run(playlist.id);
            return true;
        } catch (error) {
            this.bot.logger.error(this.bot.shardId, `[PlaylistManager] Error deleting playlist ${name}: ${error}`);
            return false;
        }
    }

    public getPlaylists(guildId: string): Array<{ name: string; trackCount: number; createdAt: number }> {
        const db = this.db;
        if (!db) return [];

        try {
            const rows = db.prepare(`
                SELECT p.name, p.created_at as createdAt, COUNT(t.id) as trackCount
                FROM playlists p
                LEFT JOIN playlist_tracks t ON p.id = t.playlist_id
                WHERE p.guild_id = ?
                GROUP BY p.id
                ORDER BY p.name ASC
            `).all(guildId) as any[];

            return rows.map(r => ({
                name: r.name,
                trackCount: Number(r.trackCount),
                createdAt: Number(r.createdAt)
            }));
        } catch (error) {
            this.bot.logger.error(this.bot.shardId, `[PlaylistManager] Error listing playlists: ${error}`);
            return [];
        }
    }

    public saveCurrentQueue(guildId: string, name: string, tracks: Omit<PlaylistTrack, 'position'>[]): boolean {
        const db = this.db;
        if (!db || tracks.length === 0 || tracks.length > PLAYLIST_TRACK_LIMIT) return false;

        try {
            const insertTrack = db.prepare(`
                INSERT INTO playlist_tracks (playlist_id, title, url, encoded, author, duration, position)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);

            const replacePlaylist = db.transaction(() => {
                db.prepare('DELETE FROM playlists WHERE guild_id = ? AND name = ?').run(guildId, name);

                const playlistInfo = db.prepare(`
                    INSERT INTO playlists (guild_id, name, created_at)
                    VALUES (?, ?, ?)
                `).run(guildId, name, Date.now());
                const playlistId = Number(playlistInfo.lastInsertRowid);

                for (let i = 0; i < tracks.length; i++) {
                    const track = tracks[i];
                    insertTrack.run(
                        playlistId,
                        track.title,
                        track.url,
                        track.encoded ?? null,
                        track.author ?? null,
                        track.duration ?? null,
                        i
                    );
                }
            });

            replacePlaylist();

            return true;
        } catch (error) {
            this.bot.logger.error(this.bot.shardId, `[PlaylistManager] Error saving queue to playlist ${name}: ${error}`);
            return false;
        }
    }

    public addTrackToPlaylist(playlistId: number, track: Omit<PlaylistTrack, 'position'>): boolean {
        const db = this.db;
        if (!db) return false;

        try {
            const countRow = db.prepare('SELECT COUNT(*) as count FROM playlist_tracks WHERE playlist_id = ?').get(playlistId) as { count: number };
            if (countRow.count >= PLAYLIST_TRACK_LIMIT) return false;

            const position = countRow.count;

            db.prepare(`
                INSERT INTO playlist_tracks (playlist_id, title, url, encoded, author, duration, position)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(
                playlistId,
                track.title,
                track.url,
                track.encoded ?? null,
                track.author ?? null,
                track.duration ?? null,
                position
            );

            return true;
        } catch (error) {
            this.bot.logger.error(this.bot.shardId, `[PlaylistManager] Error adding track to playlist ${playlistId}: ${error}`);
            return false;
        }
    }

    public removeTrackFromPlaylist(playlistId: number, index: number): boolean {
        const db = this.db;
        if (!db) return false;

        try {
            const track = db.prepare(`
                SELECT id FROM playlist_tracks
                WHERE playlist_id = ?
                ORDER BY position ASC
                LIMIT 1 OFFSET ?
            `).get(playlistId, index) as { id: number } | undefined;

            if (!track) return false;

            db.prepare('DELETE FROM playlist_tracks WHERE id = ?').run(track.id);

            const tracks = db.prepare(`
                SELECT id FROM playlist_tracks
                WHERE playlist_id = ?
                ORDER BY position ASC
            `).all(playlistId) as { id: number }[];

            const updateStmt = db.prepare('UPDATE playlist_tracks SET position = ? WHERE id = ?');
            db.transaction(() => {
                for (let i = 0; i < tracks.length; i++) {
                    updateStmt.run(i, tracks[i].id);
                }
            })();

            return true;
        } catch (error) {
            this.bot.logger.error(this.bot.shardId, `[PlaylistManager] Error removing track from playlist ${playlistId}: ${error}`);
            return false;
        }
    }

    public importFromM3u(guildId: string, name: string, m3uContent: string): PlaylistImportResult {
        const tracks = this.parseM3U(m3uContent);
        if (tracks.length === 0) return {success: false, reason: 'EMPTY'};
        if (tracks.length > PLAYLIST_TRACK_LIMIT) return {success: false, reason: 'TRACK_LIMIT'};

        const playlistTracks: Omit<PlaylistTrack, 'position'>[] = tracks.map(t => ({
            title: t.title,
            url: t.url,
            duration: t.duration,
            encoded: null,
            author: null
        }));

        const success = this.saveCurrentQueue(guildId, name, playlistTracks);
        return success
            ? {success: true, trackCount: playlistTracks.length}
            : {success: false, reason: 'SAVE_FAILED'};
    }

    private parseM3U(content: string): Array<{ title: string; url: string; duration: number }> {
        const lines = content.split(/\r?\n/);
        const tracks: Array<{ title: string; url: string; duration: number }> = [];

        let currentTitle = '';
        let currentDuration = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            if (line.startsWith('#EXTINF:')) {
                const infoPart = line.substring(8);
                const commaIndex = infoPart.indexOf(',');
                if (commaIndex !== -1) {
                    const durationStr = infoPart.substring(0, commaIndex).trim();
                    const titleStr = infoPart.substring(commaIndex + 1).trim();
                    currentDuration = parseInt(durationStr, 10) || 0;
                    currentTitle = titleStr;
                } else {
                    currentTitle = infoPart.trim();
                    currentDuration = 0;
                }
            } else if (!line.startsWith('#')) {
                if (line.startsWith('http://') || line.startsWith('https://')) {
                    tracks.push({
                        title: currentTitle || line,
                        url: line,
                        duration: currentDuration
                    });

                    if (tracks.length > PLAYLIST_TRACK_LIMIT) {
                        return tracks;
                    }
                }
                currentTitle = '';
                currentDuration = 0;
            }
        }

        return tracks;
    }
}
