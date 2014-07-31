define(["jquery", "js/utils", "js/login"], function ($, utils, login) {
    "use strict";

    var knownMetrics = {},
        knownNamespaces = {},
        namespaceList = [],
        knownGraphs = {},
        waitForGraphsToLoad = [],
        waitForMetricsToLoad = [],
        graphsLoaded = false,
        metricsLoaded = false;

    function populateGraphSearch(data) {
        var i;
        data.Graphs.sort(function (a, b) {
            return utils.alphaSort(a.Name, b.Name);
        });
        for (i = 0; i < data.Graphs.length; i++) {
            knownGraphs[data.Graphs[i].Id] = data.Graphs[i];
        }
        graphsLoaded = true;
        for (i = 0; i < waitForGraphsToLoad.length; i++) {
            waitForGraphsToLoad[i]();
        }
        waitForGraphsToLoad = [];
    }

    function finalizeMetricList() {
        var i;
        namespaceList.sort(utils.alphaSort);
        for (i = 0; i < namespaceList.length; i++) {
            knownNamespaces[namespaceList[i]].sort(utils.alphaSort);
        }
        metricsLoaded = true;
        for (i = 0; i < waitForMetricsToLoad.length; i++) {
            waitForMetricsToLoad[i]();
        }
        waitForMetricsToLoad = [];
    }

    function loadMetrics(token) {
        $.ajax({
            url: "/r/metric/list/?token=" + encodeURIComponent(token) + "&" + login.getUrlParam(),
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

    function getSavedGraphs() {
        $.ajax({
            url: "/r/graphs?" + login.getUrlParam(),
            error : function (request, textStatus, errorThrown) {
                console.log("Failed to load saved graphs");
                return;
            },
            success : function (data, textStatus, request) {
                populateGraphSearch(data);
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
        result.sort(utils.alphaSort);
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
        result.sort(utils.alphaSort);
        return result;
    }

    function saveGraph(saveObj, callback) {
        $.ajax({
            url: "/r/graph/?id=" + saveObj.Id + "&" + login.getUrlParam(),
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

    function getMetricsQuery(search, start, end, callback) {
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
            url: "/r/metric?search=" + encodeURIComponent(JSON.stringify(query)) + "&" + login.getUrlParam(),
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

    function getMetrics(search, start, end, callback) {
        if (!metricsLoaded) {
            waitForMetricsToLoad.push(function () {
                getMetricsQuery(search, start, end, callback);
            });
            return;
        }
        getMetricsQuery(search, start, end, callback);
    }
    function getGraph(graphId, callback) {
        if (!graphsLoaded) {
            waitForGraphsToLoad.push(function () {
                callback(knownGraphs[graphId]);
            });
            return;
        }
        callback(knownGraphs[graphId]);
    }

    login.onLogin(function () {
        loadMetrics("");
        getSavedGraphs();
    });

    return {
        findMetrics: findMetrics,
        findDimension: findDimension,
        getMetrics: getMetrics,
        save: saveGraph,
        getGraph: getGraph
    };
});