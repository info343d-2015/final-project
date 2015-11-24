'use strict';

var app = angular.module('FireStore', ['ui.router', 'ui.bootstrap']);

app.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider.state('home', {
            url: '/',
            templateUrl: 'partials/home.html'
        });

    $urlRouterProvider.otherwise('/');
});