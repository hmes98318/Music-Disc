/**
 * Required
 * <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
 * <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
 */


$(function () {
    $.get('/api/serverlist', (data) => {
        data.forEach((guild) => {
            const serverImage = $(`
                <div class="server-${guild.data.id}" onclick="window.location = '/servers/${guild.data.id}'">
                    <img width="60" height="60" src="${guild.data.icon
                        ? `https://cdn.discordapp.com/icons/${guild.data.id}/${guild.data.icon}.png`
                        : "https://raw.githubusercontent.com/hmes98318/Music-Disc/main/public/imgs/html/server.png"
                    }" alt="${guild.data.name}">
                    <div class="img-label">${guild.data.name}</div>
                </div>
            `);

            // 伺服器在播放中則添加在線綠點
            if (guild.active) {
                const activeDot = $(`<div class="active-dot"></div>`);
                serverImage.append(activeDot);
            }

            $("#servers").append(serverImage);
        });
    });
});
