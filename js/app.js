'use strict';

var app = angular.module('FireStore', ['ui.router', 'ui.bootstrap', 'firebase']);

app.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider.state('home', {
            url: '/',
            templateUrl: 'partials/home.html',
            controller: 'HomeCtrl'
        })
        .state('account', {
            url: '/user/account',
            templateUrl: 'partials/user/account.html'
        })
        .state('login', {
            url: '/user/login',
            templateUrl: 'partials/user/login.html',
            controller: 'UserCtrl'
        })
        .state('logout', {
            url: '/user/logout',
            controller: 'LogoutCtrl'
        })
        .state('signup', {
            url: '/user/signup',
            templateUrl: 'partials/user/signup.html',
            controller: 'UserCtrl'
        })
        .state('product-list', {
            url: '/products',
            templateUrl: 'partials/product/product-list.html',
            controller: 'ProductCtrl'
        })
        .state('product-detail', {
            url: '/products/{id}',
            templateUrl: 'partials/product/product-detail.html',
            controller: 'ProductCtrl'
        });

    $urlRouterProvider.otherwise('/');
});

app.controller('HeaderCtrl', function($scope, UserService) {
    $scope.name = UserService.user.name;
});

app.controller('UserCtrl', function($scope, UserService) {
    $scope.signin = function(login) {
        UserService.signin(login.email, login.password);
    };
    $scope.signup = function(signup) {
        UserService.signup(signup.email, signup.password, signup.name);
    };
});

app.controller('ProductCtrl', function($scope, $stateParams, $filter, ProductService, CartService) {
    $scope.products = ProductService.products;
    $scope.addToCart = CartService.addToCart;

    if($stateParams.id !== undefined) {
        //$scope.product = $scope.products.$getRecord($stateParams.id);
        $scope.products.$loaded(function() {
            $scope.product = $filter('filter')($scope.products, {
                stub: $stateParams.id
            }, true)[0];
            //ProductService.CreateReview($scope.product, 'Great Product', 5, 'This is the body of text.');
        });

    }
});

app.controller('LogoutCtrl', function($scope, $location, UserService) {
    UserService.logout();
    $location.path("/");
});

app.controller('HomeCtrl', function($scope, UserService, ProductService) {
    $scope.products = ProductService.products;
    //ProductService.CreateProduct('Apple Watch 2', 'Another watch from Apple', 400);
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
            .then(service.signin(email, password)).then(function (authData) {
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
        console.log('signing in ' + email);
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
            users.$loaded(function() {
                service.user.name = users[authData.uid].name;
                service.user.avatar = users[authData.uid].avatar;
            });
        } else {
            service.user.userId = undefined;
            service.user.name = undefined;
            service.user.avatar = undefined;
        }
    });

    service.isLoggedIn = function() {
        return service.user.userId !== undefined;
    };

    return service;
});

app.factory('ProductService', function($firebaseArray, SystemService) {
    var service = {};
    var productsRef = SystemService.ref.child('products');
    var categoriesRef = SystemService.ref.child('categories');
    service.products = $firebaseArray(productsRef);
    service.categories = $firebaseArray(categoriesRef);

    service.CreateProduct = function(name, description, price) {
        var obj = {};
        obj.name = name;
        obj.description = description;
        obj.price = price;
        obj.reviews = [];
        obj.stock = 0;
        obj.stub = name.toLowerCase().replace(/ /g,"-");
        service.products.$add(obj);
    };

    service.CreateReview = function(product, title, rating, body) {
        var productRef = service.products.$getRecord(product.$id);
        if(productRef.reviews === undefined) {
            productRef.reviews = [];
        }
        var review = {
            title: title,
            rating: rating,
            body: body,
            author: 'n/a'
        };
        productRef.reviews.push(review);
        service.products.$save(productRef);
        console.log(productRef);
    };

    service.CreateCategory = function(name, description) {
        var obj = {};
        obj.name = name;
        obj.description = description;
        obj.products = [];
        service.categories.$add(obj);
    };

    service.AddToCategory = function(name, product) {
        categoriesRef.startAt(name).endAt(name).once('value', function(snap) {
            console.log(snap);
        });
    };

    return service;
});

app.factory('CartService', function($firebaseObject, SystemService, UserService) {
    var service = {};
    var cartsRef = SystemService.ref.child('carts');
    var carts = $firebaseObject(cartsRef);

    if(UserService.isLoggedIn()) {
        service.cart = carts[UserService.user.userId];
        if(!service.cart) {
            service.cart = [];
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