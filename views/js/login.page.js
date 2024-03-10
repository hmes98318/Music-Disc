/**
 * Required
 * None
 */


document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const loginFailureMessage = document.getElementById("login-failure-message");
    const forgotPassword = document.getElementById("forgot-password");


    loginForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        const data = {
            username: username,
            password: password
        };

        fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                return response.text();
            })
            .then((data) => {
                if (data === "SUCCEED") {
                    window.location.href = "/dashboard";
                }
                else if (data === "FAILED") {
                    loginFailureMessage.textContent = "Username or password is incorrect";
                    loginFailureMessage.style.visibility = "visible";
                }
                else if (data === "BLOCKED_5") {
                    loginFailureMessage.textContent = "Too many login attempts, locked for 5 minutes.";
                    loginFailureMessage.style.visibility = "visible";
                }
            })
            .catch((error) => console.error("Error:", error));
    });


    forgotPassword.addEventListener("click", function () {
        alert("The password is set in the SITE_PASSWORD value of the .env file.");
    });
});
