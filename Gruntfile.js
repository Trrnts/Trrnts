module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      dist: {
        src: ['client/js/**/*.js'],
        dest: 'client/dist/main.min.js'
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
          'client/dist/main.min.js': ['client/dist/main.min.js']
        }
      }
    },

    jshint: {
      all: ['*.js', 'client/js/**/*.js', 'workers/**/*.js', 'server/**/*.js']
    },

    watch: {
      scripts: {
        tasks: ['buildClient'],
        files: ['client/js/**/*.js']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-notify');

  grunt.registerTask('hint', ['jshint']);
  grunt.registerTask('buildClient', ['concat', 'uglify']);
  grunt.registerTask('default', ['jshint', 'buildClient', 'watch']);
};
