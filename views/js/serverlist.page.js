/**
 * Required
 * <script src="/static/js/lib/socket.io-4.7.2.min.js"></script>
 */


document.addEventListener("DOMContentLoaded", () => {
    fetch('/api/serverlist')
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            return response.json();
        })
        .then((data) => {
            data.forEach((guild) => {
                const serverImage = document.createElement("div");
                serverImage.className = `server-${guild.data.id}`;
                serverImage.addEventListener("click", function () {
                    window.location = `/servers/${guild.data.id}`;
                });

                const img = document.createElement("img");
                img.width = 60;
                img.height = 60;
                img.alt = guild.data.name;
                img.src = guild.data.icon
                    ? `https://cdn.discordapp.com/icons/${guild.data.id}/${guild.data.icon}.png`
                    : "https://raw.githubusercontent.com/hmes98318/Music-Disc/main/public/imgs/html/server.png";

                const imgLabel = document.createElement("div");
                imgLabel.className = "img-label";
                imgLabel.textContent = guild.data.name;

                serverImage.appendChild(img);
                serverImage.appendChild(imgLabel);

                // 伺服器在播放中則添加在線綠點
                if (guild.active) {
                    const activeDot = document.createElement("div");
                    activeDot.className = "active-dot";
                    serverImage.appendChild(activeDot);
                }

                document.getElementById("servers").appendChild(serverImage);
            });
        })
        .catch((error) => console.error("Error:", error));
});
