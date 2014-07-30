define([], function () {
    "use strict";
    function alphaSort(a, b) {
        if (a < b) {
            return -1;
        }
        if (a > b) {
            return 1;
        }
        return 0;
    }
    function getUrlParam(name) {
        var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
        if (results === null || results.length === 0) {
            return null;
        }
        if (results[1]) {
            return decodeURIComponent(results[1]);
        }
        return null;
    }
    return {
        alphaSort: alphaSort,
        getUrlParam: getUrlParam
    };
});