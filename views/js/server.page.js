/**
 * Required
 * <script src="/static/js/lib/socket.io-4.7.2.min.js"></script>
 */


document.addEventListener("DOMContentLoaded", async () => {
    const serverRefreshInterval = 10000;     // 'lavashark_nowPlaying' 刷新時間 10s

    const guildID = location.pathname.replace('/servers/', '');

    const serverListContainer = document.getElementById('server-list');
    const membersListContainer = document.getElementById('members-list');


    // Get server list in the left sidebar
    try {
        const response = await fetch('/api/serverlist');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        data.forEach((guild) => {
            const activeClass = (guild.data.id === guildID) ? 'active' : '';
            const isActive = guild.active ? '<div class="active-dot"></div>' : '';
            const guildIcon = guild.data.icon ? `https://cdn.discordapp.com/icons/${guild.data.id}/${guild.data.icon}.png` : "https://raw.githubusercontent.com/hmes98318/Music-Disc/main/public/imgs/html/server.png";

            const listItem = document.createElement("li");
            listItem.className = activeClass;
            listItem.innerHTML = `
                <a href="/servers/${guild.data.id}">
                    <div class="image-container">
                        ${isActive}
                        <img class="rounded-image" src="${guildIcon}" alt="${guild.data.name}">
                    </div>
                    <span>${guild.data.name}</span>
                </a>
            `;

            listItem.addEventListener("click", function () {
                const targetURL = listItem.querySelector('a').getAttribute('href');
                window.location.href = targetURL;
            });

            serverListContainer.appendChild(listItem);
        });
    } catch (error) {
        console.error("Error:", error);
    }


    // Get selected server info
    try {
        const serverInfoResponse = await fetch(`/api/server/info/${guildID}`);
        if (!serverInfoResponse.ok) {
            throw new Error(`HTTP error! Status: ${serverInfoResponse.status}`);
        }

        const data = await serverInfoResponse.json();

        const guildIcon = data.iconURL ? data.iconURL : "https://raw.githubusercontent.com/hmes98318/Music-Disc/main/public/imgs/html/server.png";

        // Server info
        document.getElementById("server_image").src = guildIcon;
        document.getElementById("server_image").style.display = "block";
        document.getElementById("server_name").textContent = data.name;

        // Members list
        for (const memberID of data.members) {
            try {
                const memberDataResponse = await fetch(`/api/user/${memberID}`);
                if (!memberDataResponse.ok) {
                    throw new Error(`HTTP error! Status: ${memberDataResponse.status}`);
                }

                const memberData = await memberDataResponse.json();

                if (!memberData.displayAvatarURL) memberData.displayAvatarURL = "https://raw.githubusercontent.com/hmes98318/Music-Disc/main/public/imgs/html/server.png";

                const memberDiv = document.createElement("div");
                memberDiv.className = "member";
                memberDiv.innerHTML = `
                    <img class="rounded-image" src="${memberData.displayAvatarURL}" alt="${memberData.username}" width="40" height="40">
                    <h4>${memberData.username}</h4>
                `;

                membersListContainer.appendChild(memberDiv);
            } catch (error) {
                console.error("Error:", error);
            }
        }
    } catch (error) {
        console.error("Error:", error);
    }


    const socket = io();

    // Get selected server player

    // console.log('[emit] lavashark_nowPlaying');
    socket.emit("lavashark_nowPlaying", guildID);


    // intial now-playing
    document.getElementById("not_playing_text").textContent = 'No song is currently playing.';
    document.getElementById("now-playing").style.display = "block";


    socket.on('api_lavashark_nowPlaying', async (data) => {
        const notPlayingContent = document.querySelector('.not-playing-content');
        const playingContent = document.querySelector('.playing-content');
        const voiceChannelMembers = document.querySelector('.voice-channel-members');

        if (data === 'NOT_FOUND') {
            notPlayingContent.style.display = 'block';
            playingContent.style.display = 'none';
            voiceChannelMembers.style.display = 'none';
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

            const thumbnailResponse = await (await fetch(`/api/lavashark/getThumbnail/${data.current.source}/${data.current.identifier}`)).text();
            const thumbnail = thumbnailResponse !== 'NOT_FOUND' ? thumbnailResponse : '';

            // Setting the thumbnail
            const playingThumbnail = document.getElementById("playing_thumbnail");
            if (thumbnail && thumbnail !== 'NOT_FOUND') {
                playingThumbnail.src = thumbnail;
                playingThumbnail.style.display = "block";
                playingThumbnail.addEventListener("click", function () {
                    window.open(songURL, "_blank");
                });
            }
            else {
                playingThumbnail.style.display = "none";
            }

            // 當前播放的歌曲訊息
            document.getElementById("playing_h2").textContent = isPaused ? 'Now playing: (paused)' : 'Now playing: ';
            document.getElementById("playing_title").textContent = songTitle;
            document.getElementById("playing_title").href = songURL;
            document.getElementById("playing_author").innerHTML = `Autour: <strong>${songAuthor}</strong>`;
            document.getElementById("playing_duration").innerHTML = `Duration: <strong>${songDuration}</strong>`;
            document.getElementById("playing_volume").innerHTML = `Volume: <strong>${volume} / ${maxVolume}</strong>`;
            document.getElementById("playing_loop").innerHTML = `Loop: <strong>${songLoop}</strong>`;

            notPlayingContent.style.display = 'none';
            playingContent.style.display = 'block';

            // 獲取語音頻道中的成員訊息
            if (data.members.length > 0) {
                // 清空內容
                voiceChannelMembers.innerHTML = '<h3>Voice channel</h3>';

                // 添加成員訊息
                data.members.forEach((member) => {
                    const memberDiv = document.createElement("div");
                    memberDiv.className = "member";
                    memberDiv.innerHTML = `
                        <div class="image-container">
                            <img class="rounded-image" src="${member.displayAvatarURL}" alt="${member.displayName}" width="40" height="40">
                            <div class="active-dot"></div>
                        </div>
                        <h4>${member.displayName}</h4>
                    `;

                    voiceChannelMembers.appendChild(memberDiv);
                });

                voiceChannelMembers.style.display = 'block';
            }
        }
    });


    /**
     * Back to Dashboard button
     */
    // ------------------------------------------------- //

    const backToDashboardButton = document.getElementById('back-button');

    if (backToDashboardButton) {
        backToDashboardButton.addEventListener('click', function () {
            const targetURL = backToDashboardButton.querySelector('a').getAttribute('href');
            window.location.href = targetURL;
        });
    }
    // ------------------------------------------------- //

    /**
     * lavashark_nowPlaying 刷新計時器
     */
    // ------------------------------------------------- //

    let serverTimeLeft = serverRefreshInterval / 1000;      // 計時器初始時間 (s)
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