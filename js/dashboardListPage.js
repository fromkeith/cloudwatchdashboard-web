define(["jquery", "js/login"], function ($, login) {
    "use strict";


    function loadDashboard() {
        var btn = $(this),
            dashboardId = btn.data("DashboardId");
        $.mobile.changePage("#dashboard", {dataUrl: "dashboard?id=" + dashboardId});
    }

    function addButtons(data) {
        var i, dashboardRoot = $("#dashboards #dashboardList");
        for (i = 0; i < data.Dashboards.length; i++) {
            dashboardRoot.append(
                $("<button />", {text: data.Dashboards[i].Name})
                    .addClass("ui-btn")
                    .data("DashboardId", data.Dashboards[i].DashboardId)
                    .on("tap", loadDashboard)
            );
        }
        dashboardRoot.trigger("create");
    }

    function loadDashboards() {
        $.ajax({
            url: "/r/dashboards?" + login.getUrlParam(),
            error : function (request, textStatus, errorThrown) {
                console.log("Nope!");
                return;
            },
            success : function (data, textStatus, request) {
                addButtons(data);
            }
        });
    }

    function newDashboard() {
        var name = $("#dashboards #newDashboardName").val();
        if (name.length === 0) {
            return;
        }
        $.ajax({
            url: "/r/dashboard?" + login.getUrlParam(),
            type: "PUT",
            data: JSON.stringify({Name: name}),
            error : function (request, textStatus, errorThrown) {
                console.log("Nope!");
                return;
            },
            success : function (data, textStatus, request) {
                $("#dashboards #dashboardList").append(
                    $("<button />", {text: name})
                        .data("DashboardId", data.DashboardId)
                        .on("tap", loadDashboard)
                ).trigger("create");
                $.mobile.changePage("#dashboard", {dataUrl: "dashboard?id=" + data.DashboardId});
            }
        });
    }


    $(document).on("pagecreate", "#dashboards", function () {
        login.onLogin(loadDashboards);
        $("#dashboards #newDashboard").on("tap", newDashboard);
    });
    return;
});