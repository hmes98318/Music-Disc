/**
 * Required
 * <script src="/static/js/lib/jquery-3.7.1.min.js"></script>
 */


$(function () {
    const loginForm = $("#login-form");
    const loginFailureMessage = $("#login-failure-message");
    const forgotPassword = $("#forgot-password");


    loginForm.submit((event) => {
        event.preventDefault();

        const username = $("#username").val();
        const password = $("#password").val();
        const data = {
            username: username,
            password: password
        };

        $.post("/api/login", data, (data) => {
            if (data === "SUCCEED") {
                window.location.href = "/dashboard";
            }
            else if (data === "FAILED") {
                loginFailureMessage.text("Username or password is incorrect");
                loginFailureMessage.css("visibility", "visible");
            }
            else if (data === "BLOCKED_5") {
                loginFailureMessage.text("Too many login attempts, locked for 5 minutes.");
                loginFailureMessage.css("visibility", "visible");
            }
        });
    });


    forgotPassword.click(() => {
        alert("The password is set in the SITE_PASSWORD value of the .env file.");
    });
});