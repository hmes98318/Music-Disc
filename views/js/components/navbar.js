const navbarHTML = `
    <div class="navbar">
        <img src="https://cdn.discordapp.com/attachments/1161511699430510672/1171800777866620938/OjDAQSGFuaEzzcg4rOgYDldC9k_A0fAwK7IQFYuqqjp_bGp3GuhnkIuwfF4i1BPujtZVscOeBAs600-c-k-c0x00ffffff-no-rj-rp-mo.png?ex=65a7d384&is=65955e84&hm=b12526d431471c7ac9c0a0716c22bc516e740ed5dee843b8a5592a475698be5e&" alt="Logo">
        <form method="GET" action="/api/logout">
            <button class="dashboard-button">Sign out</button>
        </form>
    </div>
`;

const navbarCSS = `
    /*----- Navbar -----*/

    .navbar {
        position: fixed;
        top: 0;
        left: 0;
        height: 8vh;
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: #5b6eae;
        padding: 0px 15px;
        z-index: 1000;
    }

    .navbar button {
        color: white;
        text-decoration: none;
    }

    .navbar img {
        /* 懸停時放大 logo 速度 */
        transition: transform 0.6s ease;
        cursor: pointer;
        height: 90%;
        width: 4%;
        margin-top: 5px;
        margin-bottom: -5px;
    }

    .navbar img:hover {
        /* 懸停時放大 logo */
        transform: scale(1.1);
    }

    .dashboard-button {
        display: inline-block;
        padding: 10px 20px;
        background-color: #5b6eae;
        color: white;
        font-size: 16px;
        border: none;
        border-radius: 5px;
        text-decoration: none;
        cursor: pointer;
        transition: background-color 0.3s;
        margin-right: 25px;
    }    

    .dashboard-button:hover {
        /* 懸停時背景顏色 */
        background-color: #475b99;
    }

    /*----- END Navbar -----*/
`;


document.addEventListener("DOMContentLoaded", function () {
    const navbarContainer = document.createElement("div");
    navbarContainer.innerHTML = navbarHTML;
    document.body.insertBefore(navbarContainer, document.body.firstChild);

    const style = document.createElement("style");
    style.textContent = navbarCSS;
    document.head.appendChild(style);

    // Logo 點擊事件處理
    const logo = document.querySelector('.navbar img');

    logo.addEventListener('click', function (event) {
        event.preventDefault();
        window.location.href = '/';
    });
});
