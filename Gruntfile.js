

module.exports = function(grunt) {

    grunt.initConfig({
        jade: {
            dev: {
                options: {
                    pretty: true
                },
                files: {
                    "build/index.html" : "jade/index.jade"
                }
            }
        },
        less: {
            dev: {
                files: {
                    "build/css/index.css" : "less/index.less"
                }
            }
        },
        requirejs : {
            dev : {
                options : {
                    baseUrl: ".",
                    fileExclusionRegExp : /(\.git)|(node_modules)|(jade)|(less)|(Gruntfile.js)|(package.json)|(font)|(img)|(html)/,
                    paths : {
                        "jquery" : "js/3rdparty/jquery-1.10.2.min",
                        'jquery.mobile' : "js/3rdparty/jquery.mobile-1.4.3.min"
                    },
                    shims : {
                        'jquery.mobile' : ['jquery']
                    },
                    useStrict: true,
                    optimize: "none",
                    removeCombined: false,
                    include: ["jquery.mobile"],
                    name: "js/index",
                    out: "build/js/index.js",
                    keepBuildDir: true,
                    optimizeCss: "none"
                }
            }
        },
        jslint : {
            dev : {
                src : [
                    "js/*.js"
                ],
                directives : {
                    predef : [
                        "define", "window", "require",
                        "document", "console",
                        "clearTimeout", "setTimeout",
                        "alert", "Chart"
                    ],
                    plusplus : true,
                    unparam : true,
                    todo : true,
                    "continue" : true
                }
            }
        },
        copy: {
            require : {
                files : [
                    {cwd: "js/3rdparty",  expand: true, src: ["require.js"], dest: "build/js/"}
                ]
            }
        },
        watch : {
            jadeFiles : {
                files : ["jade/*.jade"],
                tasks : ["jade"]
            },
            jsFiles : {
                files : ["js/*.js"],
                tasks : ["jslint", "requirejs"]
            },
            lessFiles : {
                files : ["less/*.less"],
                tasks : ["less"]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jade');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-jslint');

    grunt.registerTask('default', ["copy", "jslint", "requirejs", "jade", "less", 'watch']);

}