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

    service.signup = function (email, password, name) {
        console.log("creating user " + email);

        Auth.$createUser({
                'email': email,
                'password': password
            })
            .then(service.signin).then(function (authData) {
                if (!service.user.avatar) {
                    service.user.avatar = "img/no-pic.png";
                }
                if (!service.user.name) {
                    service.user.name = name;
                }

                var newUserInfo = {
                    'avatar': service.user.avatar,
                    'name': service.user.name
                };
                users[authData.uid] = newUserInfo;

                users.$save();

                service.user.userId = authData.uid;
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
            service.user.userId = authData.uid;
        } else {
            service.user.userId = undefined;
        }
    });

    service.isLoggedIn = function() {
        return service.userId !== undefined;
    };

    return service;
});

app.factory('ProductService', function($firebaseArray, SystemService) {
    var service = {};
    var productsRef = SystemService.ref.child('products');
    service.products = $firebaseArray(productsRef);

    service.CreateProduct = function(name, description, price) {
        var obj = {};
        obj.name = name;
        obj.description = description;
        obj.price = price;
        obj.reviews = {};
        obj.stock = 0;
        service.products.$add(obj);
    };

    return service;
});

app.factory('CartService', function($firebaseObject, SystemService, UserService) {
    var service = {};
    var cartsRef = SystemService.ref.child('carts');
    var carts = $firebaseObject(cartsRef);

    if(UserService.isLoggedIn()) {
        service.cart = carts[UserService.user.userId];
        if(!service.cart.items) {
            service.cart.items = [];
        }
    } else {
        service.cart = undefined;
    }

    var addtoCart = function(product) {
        var item = {};
        item.key = product.key();
        item.quantity = product.quantity;
        if(indexOf(item, service.cart.items) === -1) {
            service.cart.items.push(item);
        } else {
            service.cart.items[indexOf(item, service.cart.items)].quantity += item.quantity;
        }

        function indexOf(o, arr) {
            for (var i = 0; i < arr.length; i++) {
                if (arr[i].key == o.key) {
                    return i;
                }
            }
            return -1;
        }
    };

    return service;
});