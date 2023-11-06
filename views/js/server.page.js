/**
 * Required
 * <script src="/static/js/lib/jquery-3.7.1.min.js"></script>
 * <script src="/static/js/lib/socket.io-4.7.2.min.js"></script>
 */


$(async function () {
    const serverRefreshInterval = 10000;     // 'lavashark_nowPlaying' 刷新時間 10s

    const guildID = location.pathname.replace('/servers/', '');

    const serverListContainer = $('#server-list');
    const membersListContainer = $('#members-list');


    // Get server list in the left sidebar
    await $.get('/api/serverlist', async (data) => {
        data.forEach((guild) => {
            const activeClass = (guild.data.id === guildID) ? 'active' : '';
            const isActive = guild.active ? '<div class="active-dot"></div>' : '';
            const guildIcon = guild.data.icon ? `https://cdn.discordapp.com/icons/${guild.data.id}/${guild.data.icon}.png` : "https://raw.githubusercontent.com/hmes98318/Music-Disc/main/public/imgs/html/server.png";

            serverListContainer.append(`
                <li class="${activeClass}">
                    <a href="/servers/${guild.data.id}">
                        <div class="image-container">
                            ${isActive}
                            <img class="rounded-image" src="${guildIcon}" alt="${guild.data.name}">
                        </div>
                        <span>${guild.data.name}</span>
                    </a>
                </li>
            `);
        });


        // li 添加點擊事件
        const serverListItems = $('#server-list li');

        serverListItems.on('click', () => {
            const targetURL = $(this).find('a').attr('href');
            window.location.href = targetURL;
        });
    });


    // Get selected server info
    await $.get(`/api/server/info/${guildID}`, async (data) => {
        const guildIcon = data.iconURL ? data.iconURL : "https://raw.githubusercontent.com/hmes98318/Music-Disc/main/public/imgs/html/server.png";

        // Server info
        document.getElementById("server_image").src = guildIcon;
        document.getElementById("server_image").style.display = "block";
        document.getElementById("server_name").textContent = data.name;

        // Members list
        data.members.forEach(async (memberID) => {
            await $.get(`/api/user/${memberID}`, (memberData) => {
                if (!memberData.displayAvatarURL) memberData.displayAvatarURL = "https://raw.githubusercontent.com/hmes98318/Music-Disc/main/public/imgs/html/server.png";

                membersListContainer.append(`
                    <div class="member">
                        <img class="rounded-image" src="${memberData.displayAvatarURL}" alt="${memberData.username}" width="40" height="40">
                        <h4>${memberData.username}</h4>
                    </div>
                `);
            });
        });
    });


    const socket = io();

    // Get selected server player

    // console.log('[emit] lavashark_nowPlaying');
    socket.emit("lavashark_nowPlaying", guildID);


    // intial now-playing
    document.getElementById("not_playing_text").textContent = 'No song is currently playing.';
    document.getElementById("now-playing").style.display = "block";


    socket.on('api_lavashark_nowPlaying', async (data) => {
        const notPlayingContent = $('.not-playing-content');
        const playingContent = $('.playing-content');
        const voiceChannelMembers = $('.voice-channel-members');

        if (data === 'NOT_FOUND') {
            notPlayingContent.show();
            playingContent.hide();
            voiceChannelMembers.hide();
        }
        else {
            // 如果該伺服器正在播放歌曲
            const songTitle = data.current.title;
            const songAuthor = data.current.author;
            const songDuration = data.current.duration.label;
            const songURL = data.current.uri;

            const isPaused = data.isPaused;
            const volume = data.volume;
            const maxVolume = data.maxVolume;
            const loopMode = ['OFF', 'SINGLE', 'ALL'];
            const songLoop = loopMode[Number(data.repeatMode)];

            const thumbnail = await $.get(`/api/lavashark/getThumbnail/${data.current.source}/${data.current.identifier}`);
            const hasThumbnail = thumbnail !== 'NOT_FOUND';

            if (hasThumbnail) {
                document.getElementById("playing_thumbnail").src = thumbnail
                document.getElementById("playing_thumbnail").style.display = "block";
                document.getElementById("playing_thumbnail").addEventListener("click", () => {
                    window.open(songURL, "_blank");
                });
            }

            // 當前播放的歌曲訊息
            document.getElementById("playing_h2").textContent = isPaused ? 'Now playing: (paused)' : 'Now playing: ';
            document.getElementById("playing_title").textContent = songTitle;
            document.getElementById("playing_title").href = songURL;
            document.getElementById("playing_author").innerHTML = `Autour: <strong>${songAuthor}</strong>`;
            document.getElementById("playing_duration").innerHTML = `Duration: <strong>${songDuration}</strong>`;
            document.getElementById("playing_volume").innerHTML = `Volume: <strong>${volume} / ${maxVolume}</strong>`;
            document.getElementById("playing_loop").innerHTML = `Loop: <strong>${songLoop}</strong>`;

            notPlayingContent.hide();
            playingContent.show();


            // 獲取語音頻道中的成員訊息
            if (data.members.length > 0) {
                // 清空內容
                voiceChannelMembers.empty();
                voiceChannelMembers.append('<h3>Voice channel</h3>');

                // 添加成員訊息
                data.members.forEach((member) => {
                    voiceChannelMembers.append(`
                        <div class="member">
                            <div class="image-container">
                                <img class="rounded-image" src="${member.displayAvatarURL}" alt="${member.displayName}" width="40" height="40">
                                <div class="active-dot"></div>
                            </div>
                            <h4>${member.displayName}</h4>
                        </div>
                    `);
                });

                voiceChannelMembers.show();
            }
        }
    });


    /**
     * Back to Dashboard button
     */
    // ------------------------------------------------- //

    const serverListItems = $('#sidebar-left back-button');

    serverListItems.on('click', () => {
        const targetURL = $(this).find('a').attr('href');
        window.location.href = targetURL;
    });

    // ------------------------------------------------- //

    /**
     * lavashark_nowPlaying 刷新計時器
     */
    // ------------------------------------------------- //

    let serverTimeLeft = serverRefreshInterval / 1000;    // 計時器初始時間 (s)
    let countdownElement = document.getElementById("server-refresh-timer");

    const serverRefreshTimer = () => {
        countdownElement.innerHTML = `<span style="color: #ffffff; opacity: 0.3; margin-left: 10px;"> refreshing in ${serverTimeLeft} s </span>`;

        if (serverTimeLeft === 0) {
            serverTimeLeft = serverRefreshInterval / 1000;
            socket.emit("lavashark_nowPlaying", guildID);
            // console.log('[emit] lavashark_nowPlaying');
        }
        else {
            serverTimeLeft--;
        }
        setTimeout(serverRefreshTimer, 1000);
    };
    serverRefreshTimer();

    // ------------------------------------------------- //
});