/**
 * Required
 * None
 */


let guilds = [];


document.addEventListener("DOMContentLoaded", () => {
    fetch('/api/serverlist')
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            return response.json();
        })
        .then((data) => {
            guilds = data;
            filterServers();
        })
        .catch((error) => console.error("Error:", error));
});


const filterButton = document.getElementById('filter-button');

function filterServers() {
    let onlyActive = false;

    if (filterButton.textContent === 'All') {
        onlyActive = true;
        filterButton.textContent = 'Active';
        filterButton.classList.add('active');
    }
    else {
        onlyActive = false;
        filterButton.textContent = 'All';
        filterButton.classList.remove('active');
    }


    document.getElementById("servers").innerHTML = '';

    guilds.forEach((guild) => {
        if (onlyActive && !guild.active) {
            return;
        }


        const serverImage = document.createElement("div");
        serverImage.className = `server-${guild.data.id}`;
        serverImage.addEventListener("click", function () {
            window.location = `/servers/${guild.data.id}`;
        });

        const img = document.createElement("img");
        img.width = 60;
        img.height = 60;
        img.alt = guild.data.name;
        img.src = guild.data.iconURL ? guild.data.iconURL : "https://raw.githubusercontent.com/hmes98318/Music-Disc/main/public/imgs/html/server.png";

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


    if (document.getElementById("servers").innerHTML === '') {
        document.getElementById("servers").innerHTML = '<h4 class="no-playing-msg">No servers are playing</h4>';
    }
}