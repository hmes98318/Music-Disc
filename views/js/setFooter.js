(function setFooter() {
    const githubLink = document.createElement("a");
    githubLink.href = "https://github.com/hmes98318/Music-Disc";
    githubLink.innerHTML = `Copyright &copy; 2022-${new Date().getFullYear()} Music-Disc`;
    githubLink.style.textDecoration = "none";
    githubLink.style.color = "inherit";
    githubLink.target = "_blank";

    githubLink.addEventListener("mouseover", () => {
        githubLink.style.color = "#0056b3"; // 懸停顏色
    });

    githubLink.addEventListener("mouseout", () => {
        githubLink.style.color = "inherit"; // 原始顏色
    });

    const copyrightText = document.getElementById("copyright");
    copyrightText.appendChild(githubLink);
})();