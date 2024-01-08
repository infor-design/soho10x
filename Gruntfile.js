//Command: C:\projects\Html5Controls\Html5Controls\ControlSamples>grunt --force
module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
	concat: {
		options: {
			separator: '',
			banner: '/*!\n Infor Html Controls v<%= pkg.version %> \n Date: <%= grunt.template.today("dd-mm-yyyy MM:hh:ss") %> \n Revision: ' + process.env.SVN_REVISION + ' \n */ \n '
		},
		basic_and_extras: {
			files: {
				'Controls/Release/<%= pkg.name %>Combined.js': ['Controls/Rating/js/*.js', 'Controls/autocomplete/js/autocomplete.js', 'Controls/tmpl/js/tmpl.js','Controls/*inforShared*/js/*.js', 'Controls/*inforProgressIndicator*/js/*.js',  'Controls/*infor*/js/*.js', 'Controls/*inforShared*/js/cultures/*.js', '!**/js/sample*.js'],
				'Controls/Release/<%= pkg.name %>Combined.css': ['Controls/autocomplete/css/autocomplete.css', 'Controls/inforCommon.css','Controls/Rating/css/*.css', 'Controls/*infor*/css/*.css']
			}
		}
    },
    uglify: {
      options: {
        banner: '/*!\n Infor Html Controls v<%= pkg.version %> \n Date: <%= grunt.template.today("dd-mm-yyyy MM:hh:ss") %> \n Revision: ' + process.env.SVN_REVISION + ' \n */ \n '
		},
		dist: {
        files: {
          'Controls/Release/<%= pkg.name %>Combined.min.js' : ['Controls/Release/<%= pkg.name %>Combined.js']
        }
      }
    },
    qunit: {
      files: ['Controls/test/**/*.html']
    },
    jshint: {
      files: ['gruntfile.js', 'Controls/test/**/*.js',
				'Controls/inforAboutDialog/js/*.js',
				'Controls/inforAccordion/js/*.js',
				'Controls/inforBarChart/js/*.js',
				'Controls/inforBreadCrumb/js/*.js',
				'Controls/inforBulletChart/js/*.js',
				'Controls/inforBusyIndicator/js/*.js'
			],
      options: {
        // options here to override JSHint defaults
        globals: {
          jQuery: true,
          console: true,
          module: true,
          document: true,
          gcl: true
        }
      }
    },
	removelogging: {
		dist: {
			src: "Controls/Release/<%= pkg.name %>Combined.js",
			dest: "Controls/Release/<%= pkg.name %>Combined.js"
		}
	},
	copy: {
		main: {
			files: [
				{expand: true, flatten: true, src: ['Controls/lib/d3.v3.min.js', 'Controls/lib/jquery-1.10.2.min.js', 'Controls/lib/jquery-1.10.2.min.map', 'Controls/lib/jquery-ui-1.10.2.custom.min.js', 'Controls/inforFavicon/favicon.ico'], dest: 'Controls/Release', filter: 'isFile'}
			]
		}
	},
	cssmin: {
		add_banner: {
			files: {
				"Controls/Release/<%= pkg.name %>Combined.min.css": ['Controls/Release/<%= pkg.name %>Combined.css']
			}
		}
	},
	replace: {
		dist: {
			options: {
				variables: {
				'revision': '<%= ' + process.env.SVN_REVISION + '%>'
			}
			},
				files: [{expand: true, flatten: true, src: ['Html5Controls.nuspec'], dest: ''}]
		}
	},
	trimtrailingspaces: {
		extensions: ['js'],
		directories: ['Controls/Release/'],
		encoding: 'utf8'
	},
	watch: {
		scripts: {
			files: ['Controls/*infor*/js/*.js', 'Controls/*infor*/css/*.css'],
			tasks: ['concat'],
			options: {
				spawn: false,
			},
		},
	},
	'ftp-deploy': {
		build: {
			auth: {
				host: 'usmvvwdev67',
				port: 21
			},
			src: 'Controls/',
			dest: '/Html5ControlsvNext/'
		}
	},
	closureLint: {
		app: {
			closureLinterPath: '',
			command: 'gjslint',
			src: ['Controls/inforAboutDialog/js/*.js'],
			options: {
				stdout: true,
				strict: true
			}
		}
	},
	closureFixStyle: {
		app: {
			closureLinterPath: '',
			command: 'fixjsstyle',
			src: ['Controls/inforAboutDialog/js/*.js'],
			options: {
				stdout: true,
				strict: true
			}
		}
	}
});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks("grunt-remove-logging");
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-replace');
	grunt.loadNpmTasks('grunt-trimtrailingspaces');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-ftp-deploy');
	grunt.loadNpmTasks('grunt-closure-linter');
	//grunt.loadNpmTasks('grunt-arialinter');

	//https://npmjs.org/package/grunt-append-sourcemapping
	//https://github.com/gmarty/grunt-closure-compiler

	grunt.registerTask('quick', ['concat']);
	grunt.registerTask('combine', ['concat', 'uglify', 'removelogging', 'copy', 'cssmin', 'replace']);
	grunt.registerTask('default', ['jshint', 'concat', 'uglify', 'removelogging' ,'copy', 'cssmin', 'replace']); //qunit
};