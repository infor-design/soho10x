//Command: C:\projects\Html5Controls\Html5Controls\ControlSamples>grunt --force
module.exports = function(grunt) {

  grunt.file.defaultEncoding = 'utf-8';
  grunt.file.preserveBOM = false;

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        separator: '',
        banner: '/*!\n Infor Html Controls v<%= pkg.version %> \n Date: <%= grunt.template.today("dd-mm-yyyy MM:hh:ss") %> \n Revision: ' + process.env.SVN_REVISION + ' \n */ \n ',
        footer: '//# sourceURL=<%= pkg.name %>Combined.js'
      },
      basic_and_extras: {
        files: {
          'Controls/Release/<%= pkg.name %>Combined.js': ['Controls/*inforShared*/js/*.js', 'Controls/*inforProgressIndicator*/js/*.js',  'Controls/multiselect/js/multiselect.js',  'Controls/autocomplete/js/autocomplete.js', 'Controls/rating/js/rating.js', 'Controls/charts/js/chart.js', 'Controls/*infor*/js/*.js', 'Controls/*inforShared*/js/cultures/*.js', '!**/js/sample*.js'],
          'Controls/Release/<%= pkg.name %>Combined.css': ['Controls/inforCommon.css', 'Controls/*infor*/css/*.css',  'Controls/multiselect/css/multiselect.css',  'Controls/autocomplete/css/autocomplete.css',  'Controls/charts/css/chart.css']
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
    jshint: {
      files: ['gruntfile.js', 'Controls/test/**/*.js',
				'Controls/inforAboutDialog/js/*.js',
				'Controls/inforAccordion/js/*.js',
				'Controls/inforApplicationNav/js/*.js',
				'Controls/inforBarChart/js/*.js',
				'Controls/inforBreadCrumb/js/*.js',
				'Controls/inforBulletChart/js/*.js'
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
				{expand: true, flatten: true, src: ['Controls/lib/d3.min.js', 'Controls/lib/jquery-3.6.0.min.js', 'Controls/lib/jquery-1.11.1.min.map', 'Controls/lib/jquery-ui-1.10.4.custom.min.js', 'Controls/inforFavicon/favicon.ico'], dest: 'Controls/Release', filter: 'isFile'}
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
			files: ['Controls/*/js/*.js', 'Controls/*/css/*.css'],
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
				port: 21,
        authKey: 'host'
			},
			src: 'Controls/',
			dest: '/Html5Controlsv3.6/'
		}
	}
});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks("grunt-remove-logging");
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-replace');
	grunt.loadNpmTasks('grunt-trimtrailingspaces');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-ftp-deploy');

	grunt.registerTask('quick', ['concat']);
	grunt.registerTask('combine', ['concat', 'uglify', 'removelogging', 'copy', 'cssmin', 'replace']);
	grunt.registerTask('default', ['concat', 'uglify', 'removelogging' ,'copy', 'cssmin', 'replace']); //qunit
};
