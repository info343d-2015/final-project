'use strict';

var app = angular.module('FireStore', ['ui.router', 'ui.bootstrap', 'firebase']);

app.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider.state('home', {
            url: '/',
            templateUrl: 'partials/home.html',
            controller: 'HomeCtrl'
        });

    $urlRouterProvider.otherwise('/');
});

app.controller('HomeCtrl', function($scope, UserService, ProductService) {

});

app.factory('SystemService', function() {
    var service = {};
    service.ref = new Firebase("https://fire-store.firebaseio.com");
    return service;
});

app.factory('UserService', function($firebaseObject, $firebaseAuth, SystemService) {
    var service = {};
    var Auth = $firebaseAuth(SystemService.ref);
    var usersRef = SystemService.ref.child('users');

    var users = $firebaseObject(usersRef);
    service.user = {};

    service.signup = function (email, password) {
        console.log("creating user " + email);

        Auth.$createUser({
                'email': email,
                'password': password
            })
            .then(service.signin).then(function (authData) {
                if (!service.user.avatar) {
                    service.user.avatar = "img/no-pic.png";
                }

                var newUserInfo = {
                    'avatar': service.user.avatar
                };
                users[authData.uid] = newUserInfo;

                users.$save();

                service.userId = authData.uid;
            })
            .catch(function (error) {
                console.log(error);
            });
    };

    service.signin = function (email, password) {
        return Auth.$authWithPassword({
            'email': email,
            'password': password
        });
    };

    service.logout = function () {
        Auth.$unauth();
    };

    Auth.$onAuth(function (authData) {
        if (authData) {
            service.userId = authData.uid;
        } else {
            service.userId = undefined;
        }
    });

    service.isLoggedIn = function() {
        return service.userId !== undefined;
    };

    return service;
});

app.factory('ProductService', function(SystemService) {
    var service = {};
    return service;
});