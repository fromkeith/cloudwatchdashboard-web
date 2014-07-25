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
    return {
        alphaSort: alphaSort
    };
});