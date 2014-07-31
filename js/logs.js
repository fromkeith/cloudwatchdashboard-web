define(["jquery", "js/utils", "js/login"], function ($, utils, login) {
    "use strict";

    var logGroups = [],
        logGroupDiv,
        logStreamDiv,
        logDiv,
        selectedGroup = "",
        groupToStreams = {},
        curLogData = [],
        timeRange = {
            start: Date.now() - 1000 * 60 * 60,
            end: Date.now()
        };

    // uugggly!
    function escapeHtml(i) {
        return $("<div />").text(i).html();
    }
    function formatDate(d) {
        return new Date(d).toLocaleTimeString("US", {localMatcher: "best fit"});
    }

    function sortAndShowLogs() {
        var i, body = logDiv.find("tbody");
        curLogData.sort(function (a, b) {
            return b.data.timestamp - a.data.timestamp;
        });
        body.empty();
        for (i = 0; i < curLogData.length; i++) {
            body.append(
                $("<tr>" +
                    "<td class='stream'>" + escapeHtml(curLogData[i].stream) + "</td>" +
                    "<td class='time'>" + formatDate(curLogData[i].data.timestamp) + "</td>" +
                    "<td class='log'>" + escapeHtml(curLogData[i].data.message) + "</td>" +
                    "</tr>"
                    )
            );
        }
        logDiv.trigger("updatelayout");
    }

    function addInStream(group, stream, token) {
        var search = {
            LogGroupName: group,
            LogStreamName: stream,
            Token: token,
            Start: timeRange.start,
            End: timeRange.end
        };
        $.ajax({
            url: "/r/logs?search=" + encodeURIComponent(JSON.stringify(search)) + "&" + login.getUrlParam(),
            error : function (request, textStatus, errorThrown) {
                return;
            },
            success : function (data, textStatus, request) {
                var i;
                if (selectedGroup !== group) {
                    return;
                }
                if (data.Events !== null && data.Events.length > 0) {
                    for (i = 0; i < data.Events.length; i++) {
                        curLogData.push({
                            data: data.Events[i],
                            stream: stream
                        });
                    }
                    if (data.NextToken !== "") {
                        addInStream(group, stream, data.NextToken);
                        return;
                    }
                }
                sortAndShowLogs();
            }
        });
    }

    function streamToggled() {
        var check = $(this);
        if (check.prop("checked")) {
            addInStream(selectedGroup, check.data("stream"), "");
        }
    }

    function fillInStreams() {
        var i, cntr = logStreamDiv.find(".ui-controlgroup-controls");
        cntr.empty();
        groupToStreams[selectedGroup].sort(utils.alphaSort);
        for (i = 0; i < groupToStreams[selectedGroup].length; i++) {
            cntr.append(
                $("<label>")
                    .append(
                        $("<input type='checkbox' />")
                            .on("change", streamToggled)
                            .data("stream", groupToStreams[selectedGroup][i])
                    )
                    .append(
                        groupToStreams[selectedGroup][i]
                    )
            );
        }
        logStreamDiv.trigger("create");
    }

    function populateStreams(group, next) {
        $.ajax({
            url: "/r/loggroup/" + encodeURIComponent(group) + "/streams?token=" + encodeURIComponent(next) + "&" + login.getUrlParam(),
            error : function (request, textStatus, errorThrown) {
                return;
            },
            success : function (data, textStatus, request) {
                var i;
                for (i = 0; i < data.StreamNames.length; i++) {
                    groupToStreams[group].push(data.StreamNames[i]);
                }
                if (data.Token !== "") {
                    populateStreams(group, data.Token);
                } else {
                    fillInStreams();
                }
            }
        });
    }

    function logGroupSelected() {
        var btn = $(this);
        selectedGroup = btn.text();
        if (groupToStreams[selectedGroup] === undefined) {
            groupToStreams[selectedGroup] = [];
            populateStreams(selectedGroup, "");
        }
    }

    function fillInGroups() {
        var i, cntr = logGroupDiv.find(".ui-controlgroup-controls");
        logGroups.sort(utils.alphaSort);
        for (i = 0; i < logGroups.length; i++) {
            cntr.append(
                $("<button />", {text: logGroups[i]})
                    .addClass("ui-btn ui-corner-all")
                    .on("tap", logGroupSelected)
            );
        }
        logGroupDiv.trigger("create");
    }

    function populateLogGroupsReq(token) {
        $.ajax({
            url: "/r/loggroups?token=" + encodeURIComponent(token) + "&" + login.getUrlParam(),
            error : function (request, textStatus, errorThrown) {
                fillInGroups();
                return;
            },
            success : function (data, textStatus, request) {
                var i;
                for (i = 0; i < data.GroupNames.length; i++) {
                    logGroups.push(data.GroupNames[i]);
                }
                if (data.Token !== "") {
                    populateLogGroupsReq(data.Token);
                } else {
                    fillInGroups();
                }
            }
        });
    }

    function populateLogGroups(div, streamsDiv, lDiv) {
        logGroupDiv = div;
        logStreamDiv = streamsDiv;
        logDiv = lDiv;
        populateLogGroupsReq("");
    }

    return {
        populateLogGroups : populateLogGroups
    };
});