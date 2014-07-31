define(["jquery", "jquery.cookie"], function ($) {
    "use strict";

    var authUrlParm = "", waitForLogin = [];

    function login() {
        $.ajax({
            url: "/r/login?xsrft=Open",
            data: JSON.stringify({
                Username: $("#login #username").val(),
                Password: $("#login #password").val()
            }),
            type: "POST",
            error : function (request, textStatus, errorThrown) {
                console.log("Nope");
                $("#login #password").val("");
                return;
            },
            success : function (data, textStatus, request) {
                var i;
                $.cookie("Auth", data.Token);
                authUrlParm = "xsrft=" + encodeURIComponent(data.Token);
                $("#login #username").val("");
                $("#login #password").val("");
                $.mobile.changePage("#home");
                for (i = 0; i < waitForLogin.length; i++) {
                    waitForLogin[i]();
                }
            }
        });
    }

    $(document).on("pagecreate", "#login", function () {
        $("#login #login").on("tap", login);
    }).on("mobileinit", function () {
        var auth = $.cookie("Auth"), i;
        if (auth === undefined || auth === null || auth === "") {
            $.mobile.changePage("#login");
            return;
        }
        authUrlParm = "xsrft=" + encodeURIComponent(auth);
        for (i = 0; i < waitForLogin.length; i++) {
            waitForLogin[i]();
        }
    });


    function getUrlParam() {
        return authUrlParm;
    }

    function addLoginSubscriber(it) {
        if (authUrlParm === "") {
            waitForLogin.push(it);
            return;
        }
        it();
    }

    return {
        getUrlParam : getUrlParam,
        onLogin: addLoginSubscriber
    };
});