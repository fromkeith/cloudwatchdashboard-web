define(["jquery", "js/utils", "js/graph", "js/graphDataStore", "js/login"], function ($, utils, grapher, dataStore, login) {
    "use strict";

    var graphs = [], originalGraphs = [], dashboardId = "";


    function loadGraph(graphId, grapherInst) {
        dataStore.getGraph(graphId, function (graphObj) {
            grapherInst.loadGraph(graphObj);
        });
    }

    function graphRemoved(which) {
        var i;
        if (which === "") {
            return;
        }
        for (i = 0; i < graphs.length; i++) {
            if (originalGraphs[i] === which) {
                graphs.splice(i, 1);
                return;
            }
        }
    }

    function insertAndLoadGraphs(data) {
        var i, graphArea = $("#dashboard #graphs"),
            g;
        for (i = 0; i < data.Graphs.length; i++) {
            g = grapher.newGraph(dataStore);
            graphArea.append(g.getRoot());
            g.setDeleteListener(graphRemoved);
            originalGraphs.push(data.Graphs[i]);
            graphs.push(g);
        }
        graphArea.trigger("create");
        for (i = 0; i < data.Graphs.length; i++) {
            loadGraph(originalGraphs[i], graphs[i]);
        }
    }

    function loadDashboard() {
        dashboardId = utils.getUrlParam("id");
        $.ajax({
            url: "/r/dashboard/" + dashboardId + "?" + login.getUrlParam(),
            error : function (request, textStatus, errorThrown) {
                console.log("Nope!");
                return;
            },
            success : function (data, textStatus, request) {
                $("#dashboard #dashboardName").val(data.Name);
                insertAndLoadGraphs(data);
            }
        });
    }

    function saveDashboard() {
        var i, j, newIds = [], old = originalGraphs.splice(0), newSet = [], c, found;
        for (i = 0; i < graphs.length; i++) {
            c = graphs[i].getId();
            if (c === "") {
                console.log("Graph must be saved first!");
                return;
            }
            found = false;
            for (j = 0; j < old.length; j++) {
                if (c === old[j]) {
                    old.splice(j, 1);
                    found = true;
                    break;
                }
            }
            if (!found) {
                newIds.push(c);
            }
            newSet.push(c);
        }
        $.ajax({
            url: "/r/dashboard/" + dashboardId + "?" + login.getUrlParam(),
            type: "POST",
            data: JSON.stringify({
                Name: $("#dashboard #dashboardName").val(),
                AddedGraphs: newIds,
                RemovedGraphs: old
            }),
            error : function (request, textStatus, errorThrown) {
                console.log("Nope!");
                return;
            },
            success : function (data, textStatus, request) {
                originalGraphs = newSet;
            }
        });
    }


    $(document).on("pagebeforeshow", "#dashboard", function () {
        $("#dashboard #graphs").empty();
        $("#dashboard #dashboardName").val("");
        dashboardId = "";
        graphs = [];
        originalGraphs = [];
        login.onLogin(loadDashboard);
    }).on("pagecreate", "#dashboard", function () {
        $("#dashboard #addGraph").on("tap", function () {
            var g = grapher.newGraph(dataStore),
                start = Date.now() - 1000 * 60 * 60,
                end = Date.now();
            g.setTime(start, end, 60);
            $("#dashboard #graphs").append(g.getRoot()).trigger("create");
            graphs.push(g);
        });
        $("#dashboard #saveDashboard").on("tap", saveDashboard);
    });
    return;
});