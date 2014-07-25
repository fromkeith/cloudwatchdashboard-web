require(["jquery", "js/graph"], function ($, grapher) {
    "use strict";
    var knownMetrics = {},
        knownNamespaces = {},
        namespaceList = [],
        displayedMetrics = [],
        knownGraphs = {},
        dataStore;
    require(["jquery.mobile"]);

    function alphaSort(a, b) {
        if (a < b) {
            return -1;
        }
        if (a > b) {
            return 1;
        }
        return 0;
    }

    function graphaSelected(e) {
        var btn = $(this),
            graphId = btn.data("GraphId"),
            g = grapher.newGraph(dataStore);
        $("#graphs").append(g.getRoot()).trigger("create");
        g.loadGraph(knownGraphs[graphId]);
        displayedMetrics.push(g);

        $("#menutoggle").trigger("click");
    }

    function populateGraphSearch(data) {
        var graphlist = $("#savedGraphs #graphlist"),
            i;
        data.Graphs.sort(function (a, b) {
            return alphaSort(a.Name, b.Name);
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
    }


    function getMetrics(search, start, end, callback) {
        var metric = knownMetrics[search.Metric],
            query = {
                Namespace   : metric.Namespace,
                MetricName  : metric.MetricName,
                StartTime   : start,
                EndTime     : end,
                Statistic   : search.Statistic
            };
        if (search.Dimension !== "" && search.Dimension.indexOf(":") !== -1) {
            query.Dimensions = [
                {
                    Name: search.Dimension.substr(0, search.Dimension.indexOf(":")).trim(),
                    value: search.Dimension.substr(search.Dimension.indexOf(":") + 1).trim()
                }
            ];
        }
        $.ajax({
            url: "/r/metric?search=" + encodeURIComponent(JSON.stringify(query)),
            headers: {
                "Region" : "us-west-2"
            },
            error : function (request, textStatus, errorThrown) {
                callback({});
                return;
            },
            success : function (data, textStatus, request) {
                callback(data);
                return;
            }
        });
    }

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


    function finalizeMetricList() {
        var i;
        namespaceList.sort(alphaSort);
        for (i = 0; i < namespaceList.length; i++) {
            knownNamespaces[namespaceList[i]].sort(alphaSort);
        }
    }

    function loadMetrics(token) {
        $.ajax({
            url: "/r/metric/list/?token=" + encodeURIComponent(token),
            type: "GET",
            headers: {
                "Region" : "us-west-2"
            },
            error : function (request, textStatus, errorThrown) {
                return;
            },
            success : function (data, textStatus, request) {
                var i, name;
                for (i = 0; i < data.Metrics.length; i++) {
                    name = data.Metrics[i].Namespace + "/" + data.Metrics[i].MetricName;
                    if (knownMetrics[name] === undefined) {
                        knownMetrics[name] = data.Metrics[i];
                    } else if (data.Metrics[i].Dimensions !== null) {
                        if (knownMetrics[name].Dimensions !== null) {
                            $.merge(knownMetrics[name].Dimensions, data.Metrics[i].Dimensions);
                        } else {
                            knownMetrics[name].Dimensions = data.Metrics[i].Dimensions;
                        }
                    }
                    if (knownNamespaces[data.Metrics[i].Namespace] === undefined) {
                        knownNamespaces[data.Metrics[i].Namespace] = [];
                        namespaceList.push(data.Metrics[i].Namespace);
                    }
                    knownNamespaces[data.Metrics[i].Namespace].push(data.Metrics[i].MetricName);
                }
                if (data.NextToken !== undefined && data.NextToken !== "") {
                    loadMetrics(data.NextToken);
                } else {
                    finalizeMetricList();
                }
            }
        });
    }

    function findMetrics(search) {
        var i, keys = Object.keys(knownMetrics), result = [];
        search = search.toLowerCase();
        // this won't scale at laterge sets... but for now.. i'm lazy
        for (i = 0; i < keys.length; i++) {
            if (keys[i].toLowerCase().indexOf(search) !== -1) {
                result.push(keys[i]);
            }
        }
        result.sort(alphaSort);
        return result;
    }

    function findDimension(metric, search) {
        var i, result = [], entry;
        search = search.toLowerCase();
        // this won't scale at laterge sets... but for now.. i'm lazy
        if (search === "") {
            for (i = 0; i < knownMetrics[metric].Dimensions.length; i++) {
                entry = knownMetrics[metric].Dimensions[i].Name + " : " + knownMetrics[metric].Dimensions[i].Value;
                result.push(entry);
            }
        } else {
            for (i = 0; i < knownMetrics[metric].Dimensions.length; i++) {
                entry = knownMetrics[metric].Dimensions[i].Name + " : " + knownMetrics[metric].Dimensions[i].Value;
                if (entry.toLowerCase().indexOf(search) !== -1) {
                    result.push(entry);
                }
            }
        }
        result.sort(alphaSort);
        return result;
    }

    function saveGraph(saveObj, callback) {
        $.ajax({
            url: "/r/graph/?id=" + saveObj.Id,
            data: JSON.stringify(saveObj),
            type: "POST",
            error : function (request, textStatus, errorThrown) {
                console.log("Nope!");
                return;
            },
            success : function (data, textStatus, request) {
                knownGraphs[data.Id] = saveObj;
                callback(data.Id);
            }
        });
    }

    dataStore = {
        findMetrics: findMetrics,
        findDimension: findDimension,
        getMetrics: getMetrics,
        save: saveGraph
    };

    $(function () {
        loadMetrics("");
        getSavedGraphs();
    });
    $(document).on("pagecreate", "#home", function () {
        $("#metricList #backToNamespaces").on("tap", function () {
            $("#metricList #metricsTab").slideUp(400);
            $("#metricList #namespacesTab").slideDown(400);
        });
        $("#addGraph").on("tap", function () {
            var g = grapher.newGraph(dataStore),
                start = Date.now() - 1000 * 60 * 60,
                end = Date.now();
            g.setTime(start, end, 60);
            $("#graphs").append(g.getRoot()).trigger("create");
            displayedMetrics.push(g);
        });
    });
    return;
});