module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      dist: {
        src: ['client/js/**/*.js'],
        dest: 'client/dist/main.js'
      }
    },

    concurrent: {
      dev: {
        tasks: ['nodemon', 'watch'],
        options: {
          logConcurrentOutput: true
        }
      }
    },

    nodemon: {
      dev: {
        script: 'server.js',
        options: {
          watch: ['server']
        }
      }
    },

    uglify: {
      options: {
        mangle: true,
        sourceMap: true,
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      dist: {
        files: {
          'client/dist/main.min.js': ['client/dist/main.js']
        }
      }
    },

    jshint: {
      all: ['*.js', 'client/js/**/*.js', 'workers/**/*.js', 'server/**/*.js']
    },

    watch: {
      options: {
        livereload: true
      },
      controllers: {
        tasks: ['buildClient'],
        files: ['client/js/**/*.js']
      },
      templates: {
        files:['client/views/**/*.tpl.html']
      }
    }
  });

  grunt.loadNpmTasks('grunt-nodemon');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-notify');
  grunt.loadNpmTasks('grunt-concurrent');

  grunt.registerTask('hint', ['jshint']);
  grunt.registerTask('buildClient', ['concat', 'uglify']);
  grunt.registerTask('default', ['jshint', 'buildClient', 'concurrent']);
};
