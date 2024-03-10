/**
 * Required
 * None
 */


document.addEventListener("DOMContentLoaded", async () => {
    const loginForm = document.getElementById("login-form");
    const loginFailureMessage = document.getElementById("login-failure-message");
    const loginButton = loginForm.querySelector('button[type="submit"]');

    try {
        const response = await fetch('/api/oauth2-link');

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.text();
        const oauth2Link = JSON.parse(data).link;

        if (!isValidUrl(oauth2Link)) {
            throw new Error('Invalid oauth2 URL. Please check your SITE_OAUTH2_LINK value');
        }


        loginButton.disabled = false; // Enable button after successful link retrieval

        loginForm.addEventListener("submit", (event) => {
            event.preventDefault();
            window.location.href = oauth2Link;
        });
    } catch (error) {
        console.error("Error:", error);
        loginFailureMessage.textContent = error.message;
        loginFailureMessage.style.visibility = "visible";
    }
});

const isValidUrl = (string) => {
    try {
        new URL(string);
        return true;
    } catch (err) {
        return false;
    }
};