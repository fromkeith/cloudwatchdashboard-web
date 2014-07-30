require(["jquery", "js/graph", "js/logs", "js/utils", "js/dashboardListPage", "js/graphDataStore", "js/dashboardPage"], function ($, grapher, logs, utils, dataStore) {
    "use strict";

    require(["jquery.mobile"]);

    /*function graphaSelected(e) {
        var btn = $(this),
            graphId = btn.data("GraphId"),
            g = grapher.newGraph(dataStore);
        $("#graphs").append(g.getRoot()).trigger("create");
        g.loadGraph(knownGraphs[graphId]);
        displayedMetrics.push(g);

        $("#menutoggle").trigger("click");
    }*/

    /*function populateGraphSearch(data) {
        var graphlist = $("#savedGraphs #graphlist"),
            i;
        data.Graphs.sort(function (a, b) {
            return utils.alphaSort(a.Name, b.Name);
        });
        for (i = 0; i < data.Graphs.length; i++) {
            knownGraphs[data.Graphs[i].Id] = data.Graphs[i];
            graphlist.append(
                $("<button />", {text: data.Graphs[i].Name})
                    .addClass("ui-btn ui-mini")
                    .on("tap", graphaSelected)
                    .data("GraphId", data.Graphs[i].Id)
            );
        }
        graphlist.trigger("updatelayout");
    }

    function getSavedGraphs() {
        $.ajax({
            url: "/r/graphs",
            error : function (request, textStatus, errorThrown) {
                console.log("Failed to load saved graphs");
                return;
            },
            success : function (data, textStatus, request) {
                populateGraphSearch(data);
            }
        });
    }*/


    /*function metricClicked(e) {
        $("#menutoggle").trigger("click");
        return;
    }

    function namespaceClicked(e) {
        var namespace = $(this).text(),
            metricRoot = $("#metricList #metrics"),
            i,
            metricList = knownNamespaces[namespace];
        $("#metricList #namespacesTab").slideUp(400);
        metricRoot.empty();
        for (i = 0; i < metricList.length; i++) {
            metricRoot.append(
                $("<button />", {text: metricList[i]})
                    .addClass("ui-btn")
                    .addClass("ui-mini")
                    .on("tap", metricClicked)
                    .data("name", namespace + "/" + metricList[i])
            );
        }
        metricRoot.trigger("updatelayout");
        $("#metricList #metricsTab").slideDown(400);
        return;
    }*/

    $(document).on("pagecreate", "#metrics", function () {
        $("#metricList #backToNamespaces").on("tap", function () {
            $("#metricList #metricsTab").slideUp(400);
            $("#metricList #namespacesTab").slideDown(400);
        });
        $("#metrics #addGraph").on("tap", function () {
            var g = grapher.newGraph(dataStore),
                start = Date.now() - 1000 * 60 * 60,
                end = Date.now();
            g.setTime(start, end, 60);
            $("#metrics #graphs").append(g.getRoot()).trigger("create");
        });
    }).on("pagecreate", "#logs", function () {
        logs.populateLogGroups($("#logGroups"), $("#logStreams"), $("#logcontent"));
    });
    return;
});