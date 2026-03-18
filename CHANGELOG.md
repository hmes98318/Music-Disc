# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- `/playlast` command — replay the current or last played song when the queue is empty
- `/blacklist` admin command — dynamically add/remove/list blacklisted users at runtime with SQLite persistence (`BlacklistManager`)
- Voice channel status — automatically shows the currently playing song name (with configurable emoji) in the voice channel status; clears on queue end or player destroy
- `replyEphemeralError()` method on `CommandContext` — sends denial messages as ephemeral embeds for slash commands
- `requesterOnly` config array — restrict specific commands (e.g., `skip`, `seek`) to the song requester
- `requesterDjBypass` config array — allow DJs to bypass `requesterOnly` for specific commands
- Requester-only check for `/seek` command (when `'seek'` is in `requesterOnly`)
- Dashboard embed now shows "Requester: @mention" below the volume/loop line
- Dashboard embed shows "Dynamic DJ: @mention" only when dynamic DJ mode is active and a DJ is assigned
- `voiceStatusEmojis` config option — array of emojis for voice channel status (set to `[]` to disable)
- `fairQueue` config option (default: false) — round-robin queue rotation
- `maxQueuedSongs.global` config option — absolute queue size cap
- Queue persistence now saves `player.current` as the first track, ensuring the playing song survives restarts
- Queue persistence saves on each track start and on graceful shutdown
- Queue restore uses encoded track strings first, with URI and title search fallbacks
- `setVoiceChannelStatus()` utility — uses `VoiceChannel.setStatus()` if available, falls back to REST API
- `client.lastPlayedTracks` Map for per-guild last played track tracking (persists across player lifecycle)

### Changed
- Queue embed redesigned: uses `setDescription()` instead of `addFields()`, shows 5 songs per page (was 10), each entry shows song name on line 1 and `duration | @mention` on line 2
- All slash command denial/error messages are now ephemeral (only visible to the invoking user)
- Skip button denial messages now use ephemeral embeds instead of plain text
- Config `skipOnlyRequester` (boolean) replaced with `requesterOnly` (string array)
- Config `skipDjBypass` (boolean) replaced with `requesterDjBypass` (string array)
- Blacklist check now includes both static (`config.blacklist`) and dynamic (`BlacklistManager`) sources
- Queue persistence startup delay increased from 3s to 5s for Lavalink node availability
- `queue.embed.ts` `queue()` function signature changed to accept description string directly

### Fixed
- Queue persistence not saving the currently playing track (only saved upcoming tracks)
- Queue restore failures when using URI-based search — now uses encoded track strings as primary method
- Skip denial in button handler sent plain text instead of styled embed
