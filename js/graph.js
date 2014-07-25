define(["jquery"], function ($) {
    "use strict";

    var colors = [
        "#EC6A8E",
        "#63842B",
        "#847717",
        "#9D681E",
        "#AE5834",
        "#CE73AE",
        "#5D8EC6",
        "#388D4B",
        "#9E82C3",
        "#F56D68"
    ];

    function formatDate(d) {
        return d.toLocaleTimeString("US", {localMatcher: "best fit"});
    }

    function drawGraph() {
        var ctx = this.m.canvas[0].getContext("2d"),
            chart = new Chart(ctx),
            xLabels = [],
            xTime = [],
            yVals = [],
            i,
            t,
            j,
            max,
            min,
            numSteps,
            stepWidth,
            graphingDataSet = [];
        for (j = 0; j < this.m.dataSets.length; j++) {
            yVals[j] = [];
        }
        for (i = this.m.startTime; i < this.m.endTime; i += this.m.period * 1000) {
            xTime.push(i / 1000);
            xLabels.push(formatDate(new Date(i)));
            for (j = 0; j < this.m.dataSets.length; j++) {
                yVals[j].push(null);
            }
        }

        for (j = 0; j < this.m.dataSets.length; j++) {
            t = 0;
            if (this.m.dataSets[j].data.Datapoints === undefined) {
                continue;
            }
            for (i = 0; i < this.m.dataSets[j].data.Datapoints.length; i++) {
                while (true) {
                    if (t >= xTime.length) {
                        break;
                    }
                    if (this.m.dataSets[j].data.Datapoints[i].Time <= xTime[t]) {
                        yVals[j][t] = this.m.dataSets[j].data.Datapoints[i].Value;
                        if (max === undefined || this.m.dataSets[j].data.Datapoints[i].Value > max) {
                            max = this.m.dataSets[j].data.Datapoints[i].Value;
                        }
                        if (min === undefined || this.m.dataSets[j].data.Datapoints[i].Value < min) {
                            min = this.m.dataSets[j].data.Datapoints[i].Value;
                        }
                        break;
                    }
                    t++;
                }
            }
            graphingDataSet.push({
                strokeColor : this.m.dataSets[j].color,
                pointColor :  this.m.dataSets[j].color,
                pointStrokeColor:  this.m.dataSets[j].color,
                data : yVals[j],
                opposite: true
            });
        }
        max += 1;
        min -= 1;
        stepWidth = Math.ceil(Math.abs(max - min) / 20);
        numSteps = Math.ceil(Math.abs(max - min) / stepWidth);
        chart.Line({
            labels : xLabels,
            datasets : graphingDataSet
        }, {
            animation : false,
            scaleOverride : true,
            scaleSteps : numSteps,
            scaleStepWidth : stepWidth,
            scaleStartValue : min,
            datasetStrokeWidth : 1,
            datasetStroke : true,
            pointDotRadius : 2,
            pointDotStrokeWidth: 1,
            pointDot: true,
            datasetFill : false
        });
    }

    function setDataGraph(graphObj, data) {
        data.Datapoints.sort(function (a, b) {
            return a.Time - b.Time;
        });
        graphObj.data = data;
    }

    function setTimeGraph(start, end, period) {
        this.m.startTime = start;
        this.m.endTime = end;
        this.m.period = period;
    }

    function addMetricGraph(graphObj) {
        var that = this,
            thisMetric = {Metric: "", Dimension: ""};
        this.m.legend.append(
            $("<div />")
                .attr("id", "entry")
                .attr("data-mini", "true")
                .css("width", 400)
                .append(
                    $("<div>")
                        .addClass("colorband")
                        .css("background-color", graphObj.color)
                )
                .append(
                    $("<ul />")
                        .attr("data-role", "listview")
                        .attr("data-inset", "true")
                        .attr("data-filter", "true")
                        .attr("data-filter-placeholder", "Namespace/Metric")
                        .attr("data-mini", "true")
                        .attr("reveal", "true")
                        .on("filterablebeforefilter", function (e, data) {
                            var ul = $(this),
                                input = $(data.input),
                                value = input.val(),
                                metrics = that.m.dataStore.findMetrics(value),
                                i;
                            ul.empty();
                            function itemSelected() {
                                ul.empty();
                                input.val($(this).text());
                                thisMetric.Metric = $(this).text();
                            }
                            thisMetric.Metric = value;
                            for (i = 0; i < metrics.length && i < 5; i++) {
                                ul.append(
                                    $("<li />", {text: metrics[i]})
                                        .on("tap", itemSelected)
                                );
                            }
                            return;
                        }).on("filterablecreate", function (e, data) {
                            var ul = $(this);
                            $(data.input).on("focusout", function () {
                                ul.empty();
                            });
                        })
                )
                .append(
                    $("<ul />")
                        .attr("data-role", "listview")
                        .attr("data-inset", "true")
                        .attr("data-filter", "true")
                        .attr("data-filter-placeholder", "Dimension")
                        .attr("data-mini", "true")
                        .attr("reveal", "true")
                        .on("filterablebeforefilter", function (e, data) {
                            var ul = $(this),
                                input = $(data.input),
                                value = input.val(),
                                metrics = that.m.dataStore.findDimension(thisMetric.Metric, value),
                                i;
                            ul.empty();
                            function itemSelected() {
                                ul.empty();
                                input.val($(this).text());
                                thisMetric.Dimension = $(this).text();
                            }
                            thisMetric.Dimension = value;
                            for (i = 0; i < metrics.length && i < 10; i++) {
                                ul.append(
                                    $("<li />", {text: metrics[i]})
                                        .on("tap", itemSelected)
                                );
                            }
                            return;
                        })
                )
                .append(
                    $("<select />")
                        .attr("data-mini", "true")
                        .append(
                            $("<option value='Average'>Average</option>")
                        )
                        .append(
                            $("<option value='Sum'>Sum</option>")
                        )
                        .append(
                            $("<option value='SampleCount'>SampleCount</option>")
                        )
                        .append(
                            $("<option value='Maximum'>Maximum</option>")
                        )
                        .append(
                            $("<option value='Minimum'>Minimum</option>")
                        )
                )
                .append(
                    $("<button />", {text: "Update"})
                        .on("tap", function () {
                            var root = $(this).parents("#entry"),
                                stat = root.find("select").val();
                            root.find("input").attr("disabled", "disabled");
                            graphObj.search = {
                                Metric: thisMetric.Metric,
                                Dimension: thisMetric.Dimension,
                                Statistic: stat
                            };
                            that.m.dataStore.getMetrics(graphObj.search, that.m.startTime, that.m.endTime, function (data) {
                                root.find("input").removeAttr("disabled", "disabled");
                                that.setData(graphObj, data);
                                that.draw();
                            });
                        })
                ).append(
                    $("<button />", {text: "Remove"})
                        .on("tap", function () {
                            $(this).parents("#entry").remove();
                            that.remove(graphObj);
                        })
                )
        );
        this.m.legend.trigger("create");
    }

    function newGraph(dataStore) {
        var graph,
            canvas = $("<canvas />").attr({width: "800px", height: "600px"}).css({"width": "800px", "height": 600}),
            root = $("<div />"),
            legend;

        legend = $("<div />", {id : "legend"})
            .attr("data-role", "controlgroup")
            .attr("data-mini", "true");

        root.addClass("ui-corner-all custom-corners")
            .append(
                $("<div/ >")
                    .addClass("ui-bar ui-bar-a")
                    .attr("data-role", "header")
                    .append($("<h4 />", {text: "New Graph"}))
                    .append(
                        $("<button />", {text: "Add Metric"})
                            .addClass("ui-btn ui-btn-inline ui-mini ui-corner-all ui-icon-plus ui-btn-icon-left")
                            .on("tap", function () {
                                graph.addMetric();
                            })
                    )
                    .append(
                        $("<button />", {text: "Save"})
                            .addClass("ui-btn ui-btn-inline ui-mini ui-corner-all ui-icon-check ui-btn-icon-left")
                            .on("tap", function () {
                                var metrics = [],
                                    i,
                                    saveObj;
                                for (i = 0; i < graph.m.dataSets.length; i++) {
                                    metrics.push(graph.m.dataSets[i].search);
                                }
                                saveObj = {
                                    Metrics: metrics,
                                    Name: "New Graph",
                                    Time: {
                                        Start: graph.m.startTime,
                                        End: graph.m.endTime,
                                        Period: graph.m.period
                                    },
                                    Id: graph.m.uuid
                                };
                                graph.m.dataStore.save(saveObj, function (uuid) {
                                    graph.m.uuid = uuid;
                                });
                            })
                    )
            )
            .append(
                $("<div />").addClass("ui-body ui-body-a")
                    .append(
                        canvas
                    ).append(
                        legend
                    )
            );

        graph = {
            m : {
                root: root,
                canvas: canvas,
                legend: legend,
                dataSets: [],
                startTime: 0,
                endTime: 0,
                period: 0,
                dataStore: dataStore,
                freeColors: colors.slice(),
                uuid: ""
            },
            draw : function () {
                return drawGraph.call(graph);
            },
            setData : function (index, data) {
                return setDataGraph.call(graph, index, data);
            },
            setTime : function (start, end, period) {
                return setTimeGraph.call(graph, start, end, period);
            },
            getRoot : function () {
                return graph.m.root;
            },
            addMetric: function () {
                var graphObj = {
                    color: graph.m.freeColors.pop(),
                    data: {}
                };
                graph.m.dataSets.push(graphObj);
                return addMetricGraph.call(graph, graphObj);
            },
            remove: function (graphObj) {
                var i;
                for (i = 0; i < graph.m.dataSets.length; i++) {
                    if (graph.m.dataSets[i].color === graphObj.color) {
                        graph.m.dataSets.splice(i, 1);
                        graph.m.freeColors.push(graphObj.color);
                        return;
                    }
                }
            }
        };
        return graph;
    }

    return {
        newGraph : newGraph
    };
});