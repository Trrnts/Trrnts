module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      dist: {
        // Don't concat existing main.min.js file!
        src: ['!client/main.min.js', 'client/**/*.js'],
        dest: 'client/main.min.js'
      }
    },

    uglify: {
      options: {
        // Don't mangle because of Angular.
        mangle: false,
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      dist: {
        files: {
          'client/main.min.js': ['client/main.min.js']
        }
      }
    },

    jshint: {
      ignores: ['node_modules/**/*.js', 'client/main.min.js'],
      all: ['**/*.js']
    },

    watch: {
      scripts: {
        tasks: ['buildClient'],
        files: ['client/**/*.js']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-notify');

  grunt.registerTask('buildClient', ['uglify', 'concat']);
  grunt.registerTask('hint', ['jshint']);
  grunt.registerTask('default', ['buildClient', 'watch']);
};
