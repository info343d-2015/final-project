'use strict';

var app = angular.module('FireStore', ['ui.router', 'ui.bootstrap']);

app.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider.state('home', {
            url: '/',
            templateUrl: 'partials/home.html',
            controller: 'HomeCtrl'
        });

    $urlRouterProvider.otherwise('/');
});

app.controller('HomeCtrl', ['$scope', 'ProductService', function($scope, ProductService) {

}]);

app.factory('SystemService', function() {
    var service = {};
    service.ref = new Firebase("https://fire-store.firebaseio.com");
    return service;
});

app.factory('UserService', function(SystemService) {
    var service = {};
    var Auth = $firebaseAuth(SystemService.ref);
    var usersRef = ref.child('users');

    service.users = $firebaseObject(usersRef);

    service.signup = function (email, password) {
        console.log("creating user " + email);

        Auth.$createUser({
                'email': email,
                'password': password
            })
            .then($scope.signIn).then(function (authData) {
                if (!$scope.newUser.avatar) {
                    $scope.newUser.avatar = "img/no-pic.png";
                }

                var newUserInfo = {
                    'avatar': $scope.newUser.avatar
                };
                $scope.users[authData.uid] = newUserInfo;

                $scope.users.$save();

                $scope.userId = authData.uid;
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
            $scope.userId = authData.uid;
        }
        else {
            $scope.userId = undefined;
        }
    });

    return service;
});

app.factory('ProductService', function(SystemService) {
    var service = {};
    return service;
});