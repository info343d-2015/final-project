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
        })
        .state('cart', {
            url: '/cart',
            templateUrl: 'partials/cart/cart.html',
            controller: 'CartCtrl'
        });

    $urlRouterProvider.otherwise('/');
});

app.controller('HeaderCtrl', function($scope, UserService) {
    $scope.user = UserService.user;
});

app.controller('UserCtrl', function($scope, $location, UserService) {
    $scope.signin = function(login) {
        UserService.signin(login.email, login.password);
        $location.path("home");
    };
    $scope.signup = function(signup) {
        UserService.signup(signup.email, signup.password, signup.name);
        $location.path("home");
    };
});

app.controller('ProductCtrl', function($scope, $stateParams, $filter, $location, ProductService, CartService) {
    $scope.products = ProductService.products;
    $scope.addToCart = function(product) {
        CartService.addToCart(product);
        $location.path("cart");
    };
    $scope.addCategory = ProductService.AddCategory;
    $scope.newCategory = undefined;

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

app.controller('CartCtrl', function($scope, ProductService, CartService) {
    $scope.cart = CartService.cart;

    $scope.process = function(cart) {
        if(cart !== undefined && cart !== null) {
            var result = [];
            for(var i = 0; i < cart.length; i++) {
                var product = ProductService.RetrieveProduct(cart[i].id);
                product.quantity = cart[i].quantity;
                result.push(product);
            }
            return result;
        }
        return cart;
    }
});

app.controller('LogoutCtrl', function($scope, $location, UserService) {
    console.log('logging user out');
    UserService.logout();
    $location.path("home");
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
    service.categories = [];
    service.products = $firebaseArray(productsRef);

    var updateCategories = function() {
        service.products.$loaded(function() {
            for(var i = 0; i < service.products.length; i++) {
                var product = service.products[i];
                if(product.categories) {
                    product.categories.forEach(function(prodCat) {
                        if(service.categories.indexOf(prodCat) === -1) {
                            service.categories.push(prodCat);
                        }
                    });
                }
            }
        });
    };

    updateCategories();

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
    };

    service.AddCategory = function(product, name) {
        var productRef = service.products.$getRecord(product.$id);
        if(productRef.categories === undefined) {
            productRef.categories = [];
        }
        if(productRef.categories.indexOf(name) === -1) {
            productRef.categories.push(name);
        }
        service.products.$save(productRef);
    };

    service.RetrieveProduct = function(id) {
        return service.products.$getRecord(id);
    };

    return service;
});

app.factory('CartService', function($firebaseObject, SystemService, UserService) {
    var service = {};
    var cartsRef = SystemService.ref.child('carts');
    var carts = $firebaseObject(cartsRef);

    service.cart = {};
    if(UserService.isLoggedIn()) {
        carts.$loaded(function() {
            service.cart.items = carts[UserService.user.userId].items || [];
        });
    } else {
        service.cart.items = undefined;
    }

    service.addToCart = function(product) {
        var item = {};
        item.id = product.$id;
        item.quantity = product.quantity;
        if(indexOf(item, service.cart.items) === -1) {
            service.cart.items.push(item);
        } else {
            service.cart.items[indexOf(item, service.cart.items)].quantity += item.quantity;
        }

        carts[UserService.user.userId] = service.cart;
        carts.$save();

        function indexOf(o, arr) {
            for (var i = 0; i < arr.length; i++) {
                if (arr[i].id == o.id) {
                    return i;
                }
            }
            return -1;
        }
    };

    return service;
});