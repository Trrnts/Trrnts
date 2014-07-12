module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        separator: ';'
      },
      dist: {
        // Don't concat existing main.min.js file!
        src: ['!client/main.min.js', 'client/**/*.js'],
        dest: 'client/main.min.js'
      }
    },

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      dist: {
        files: {
          'client/main.min.js': ['client/main.min.js']
        }
      }
    },

    jshint: ['client/**/*.js', 'workers/**/*.js', 'server/**/*.js'],

    watch: {
      scripts: {
        tasks: ['buildClient'],
        files: ['client/**/*.js']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-notify');

  grunt.registerTask('buildClient', ['concat', 'uglify'])

  grunt.registerTask('default', ['jshint', 'buildClient', 'watch']);
};
