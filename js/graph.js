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

    //function formatDate(d) {
    //    return d.toLocaleTimeString("US", {localMatcher: "best fit"});
    //}

    function drawGraph() {
        var i,
            j,
            s;
        for (j = this.m.chart.data.length; j < this.m.dataSets.length; j++) {
            this.m.chart.data.push([]);
        }
        if (this.m.dataSets.length < this.m.chart.data.length) {
            this.m.chart.data.splice(this.m.dataSets.length);
            this.m.chart.series.splice(this.m.dataSets.length);
        }
        s = 0;
        for (j = 0; j < this.m.dataSets.length; j++) {
            if (this.m.dataSets[j].data === undefined) {
                continue;
            }
            if (this.m.dataSets[j].data.Datapoints === undefined) {
                continue;
            }
            if (this.m.dataSets[j].data.Datapoints.length === 0) {
                continue;
            }
            if (s >= this.m.chart.series.length) {
                this.m.chart.series.push({});
            }
            this.m.chart.data[j].splice(0);
            for (i = 0; i < this.m.dataSets[j].data.Datapoints.length; i++) {
                this.m.chart.data[j].push({
                    x: this.m.dataSets[j].data.Datapoints[i].Time,
                    y: this.m.dataSets[j].data.Datapoints[i].Value
                });
            }

            this.m.chart.series[s].color = this.m.dataSets[j].color;
            this.m.chart.series[s].name = this.m.dataSets[j].search.Metric + " " + this.m.dataSets[j].search.Dimension;
            this.m.chart.series[s].data = this.m.chart.data[j];
            s++;
        }
        if (s < this.m.chart.series) {
            this.m.chart.series.splice(s);
        }
        if (s === 0) {
            return;
        }
        this.m.chart.graphContainer.show();
        if (this.m.chart.graph === undefined) {
            this.m.chart.graph = new Rickshaw.Graph({
                element: this.m.chart.main[0],
                series: this.m.chart.series,
                width: this.m.display.width,
                height: this.m.display.height,
                renderer: "line"
            });
            this.m.chart.graph.render();
        } else {
            this.m.chart.graph.update();
            this.m.chart.y_ticks.render();
            this.m.chart.x_axis.render();
            this.m.chart.c_legend.render();
            this.m.chart.shelving = new Rickshaw.Graph.Behavior.Series.Toggle({
                graph: this.m.chart.graph,
                legend: this.m.chart.c_legend
            });
            return;
        }

        this.m.chart.y_ticks = new Rickshaw.Graph.Axis.Y({
            graph: this.m.chart.graph,
            orientation: 'left',
            tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
            height: this.m.display.height,
            width: 40,
            element: this.m.chart.leftAxis[0]
        });
        this.m.chart.y_ticks.render();

        this.m.chart.c_legend = new Rickshaw.Graph.Legend({
            graph: this.m.chart.graph,
            element: this.m.chart.legend[0]
        });

        this.m.chart.x_axis = new Rickshaw.Graph.Axis.Time({
            graph: this.m.chart.graph,
            ticksTreatment: 'glow',
            timeFixture: new Rickshaw.Fixtures.Time.Local()
        });
        this.m.chart.x_axis.render();
        this.m.chart.hoverDetail = new Rickshaw.Graph.HoverDetail({
            graph: this.m.chart.graph,
            xFormatter: function (x) {
                return new Date(x * 1000).toString();
            }
        });
        this.m.chart.shelving = new Rickshaw.Graph.Behavior.Series.Toggle({
            graph: this.m.chart.graph,
            legend: this.m.chart.c_legend
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
            thisMetric = {
                Metric: "Namespace/Metric",
                Dimension: "Dimension"
            },
            entry,
            selectedDefault = "Average";
        if (graphObj === undefined) {
            graphObj = {
                data: {}
            };
        } else {
            thisMetric.Metric = graphObj.search.Metric;
            thisMetric.Dimension = graphObj.search.Dimension;
            selectedDefault = graphObj.search.Statistic;
        }
        graphObj.color = this.m.freeColors.pop();
        this.m.dataSets.push(graphObj);

        function createAndSelect(name) {
            var selected = selectedDefault === name ? "selected" : "";
            return $("<option value='" + name + "'" + selected + ">" + name + "</option>");
        }

        entry = $("<div />")
            .attr("id", "entry")
            .attr("data-mini", "true")
            .css("width", (400 < $(window).width()) ? 400 : $(window).width() * 0.7)
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
                    .attr("data-filter-placeholder", thisMetric.Metric)
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
                    .attr("data-filter-placeholder", thisMetric.Dimension)
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
                        createAndSelect("Average")
                    )
                    .append(
                        createAndSelect("Sum")
                    )
                    .append(
                        createAndSelect("SampleCount")
                    )
                    .append(
                        createAndSelect("Maximum")
                    )
                    .append(
                        createAndSelect("Minimum")
                    )
            )
            .append(
                $("<button />", {text: "Update"})
                    .attr("id", "update")
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
            );
        this.m.entrySection.append(entry);
        this.m.entrySection.trigger("create");

    }

    function loadGraphImpl(graph) {
        var i, that = this;
        this.m.uuid = graph.Id;
        this.m.startTime = graph.Time.Start;
        this.m.endTime = graph.Time.End;
        this.m.period = graph.Time.Period;
        this.m.title.val(graph.Name);
        for (i = 0; i < graph.Metrics.length; i++) {
            this.addMetric({
                search: graph.Metrics[i]
            });
        }
        setTimeout(function () {
            that.m.entrySection.find("#update").trigger("tap");
            that.m.entrySection.hide();
        }, 200);
        this.edit(false);
    }

    function editGraph(editable) {
        var title = this.m.root.find("#title");
        if (editable) {
            this.m.root.find("#save").text("Save").removeClass("ui-icon-edit").addClass("ui-icon-check");
            this.m.entrySection.show();
            title.textinput("enable");
            return;
        }
        this.m.root.find("#save").text("Edit").removeClass("ui-icon-check").addClass("ui-icon-edit");
        this.m.entrySection.hide();
        title.textinput("disable");

    }

    function newGraph(dataStore) {
        var graph,
            canvas = $("<div />").css({"width": "800px", "height": 600}),
            root = $("<div />"),
            entrySection,
            leftAxis = $("<div />"),
            rightAxis = $("<div />"),
            legend = $("<div />"),
            graphContainer = $("<div />"),
            windowWidth = $(window).width(),
            windowHeight = $(window).height(),
            title = $("<input />", {value: "New Graph", type: "text"}).attr("id", "title").addClass("ui-mini");

        entrySection = $("<div />", {id : "entrySection"})
            .attr("data-role", "controlgroup")
            .attr("data-mini", "true");

        graphContainer.css({
            width: windowWidth * 0.7,
            height: windowHeight * 0.8 + 50 // for top
        });
        canvas.css({
            width: windowWidth * 0.7,
            height: windowHeight * 0.8
        });

        root.addClass("ui-corner-all custom-corners")
            .append(
                $("<div/ >")
                    .addClass("ui-bar ui-bar-a")
                    .attr("data-role", "header")
                    .append(
                        $("<div />").addClass("titleCover")
                            .append(
                                title
                            )
                    )
                    .append(
                        $("<button />", {text: "Add Metric"})
                            .addClass("ui-btn ui-btn-inline ui-mini ui-corner-all ui-icon-plus ui-btn-icon-left")
                            .on("tap", function () {
                                graph.addMetric();
                                $(this).parents(".ui-bar").find(".ui-icon-edit").text("Save").removeClass("ui-icon-edit").addClass("ui-icon-check");
                                graph.m.entrySection.show();
                            })
                    )
                    .append(
                        $("<button />", {text: "Remove"})
                            .attr("id", "remove")
                            .addClass("ui-btn ui-btn-inline ui-mini ui-corner-all ui-icon-delete ui-btn-icon-left")
                            .on("tap", function () {
                                graph.deleteMe();
                            })
                    )
                    .append(
                        $("<button />", {text: "Save"})
                            .attr("id", "save")
                            .addClass("ui-btn ui-btn-inline ui-mini ui-corner-all ui-icon-check ui-btn-icon-left")
                            .on("tap", function () {
                                var metrics = [],
                                    i,
                                    saveObj,
                                    btn = $(this);
                                if (btn.text() === "Edit") {
                                    graph.edit(true);
                                } else {
                                    for (i = 0; i < graph.m.dataSets.length; i++) {
                                        metrics.push(graph.m.dataSets[i].search);
                                    }
                                    saveObj = {
                                        Metrics: metrics,
                                        Name: graph.m.title.val(),
                                        Time: {
                                            Start: graph.m.startTime,
                                            End: graph.m.endTime,
                                            Period: graph.m.period
                                        },
                                        Id: graph.m.uuid
                                    };
                                    graph.m.dataStore.save(saveObj, function (uuid) {
                                        graph.m.uuid = uuid;
                                        graph.edit(false);
                                    }, function () {
                                        alert("Error saving graph!");
                                    });
                                }
                            })
                    )
                    .append(
                        legend
                    )
            )
            .append(
                $("<div />").addClass("ui-body ui-body-a grapharea")
                    .append(
                        graphContainer.addClass("graphContainer")
                            .append(
                                leftAxis.addClass("leftAxis")
                            )
                            .append(
                                canvas.addClass("graph")
                            )
                            .append(
                                rightAxis
                            ).hide()
                    )
                    .append(
                        entrySection
                    )
            );

        graph = {
            m : {
                root: root,
                chart : {
                    main: canvas,
                    leftAxis: leftAxis,
                    rightAxis: rightAxis,
                    data: [],
                    series: [],
                    legend: legend,
                    graphContainer: graphContainer
                },
                entrySection: entrySection,
                dataSets: [],
                startTime: 0,
                endTime: 0,
                period: 0,
                dataStore: dataStore,
                freeColors: colors.slice(),
                uuid: "",
                title: title,
                display: {
                    width: windowWidth * 0.7,
                    height: windowHeight * 0.8
                },
                deleteListener: null
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
            setId : function (id) {
                graph.m.uuid = id;
            },
            getId : function (id) {
                return graph.m.uuid;
            },
            getRoot : function () {
                return graph.m.root;
            },
            loadGraph: function (g) {
                return loadGraphImpl.call(graph, g);
            },
            addMetric: function (graphObj) {
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
                graph.draw();
            },
            edit: function (editable) {
                return editGraph.call(graph, editable);
            },
            setDeleteListener: function (d) {
                graph.m.deleteListener = d;
            },
            deleteMe: function () {
                graph.m.root.remove();
                if (graph.m.deleteListener !== null) {
                    graph.m.deleteListener(graph.m.uuid);
                }
                graph.m = null;
            }
        };
        return graph;
    }

    return {
        newGraph : newGraph
    };
});