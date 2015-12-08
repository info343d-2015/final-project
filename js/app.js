'use strict';

var app = angular.module('FireStore', ['ui.router', 'ui.bootstrap', 'firebase', 'ngRaty']);

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
        .state('logout', {
            url: '/user/logout',
            controller: 'LogoutCtrl'
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

app.controller('HeaderCtrl', function($scope, UserService, $uibModal) {
    $scope.user = UserService.user;

    $scope.signIn = function() {
        var modalInstance = $uibModal.open({
            templateUrl: 'partials/user/login.html',
            controller: 'LoginCtrl'
        });
    };
});

//controller for the modal to make quick view pop up
app.controller('ProductModal', function($scope, $stateParams, $filter, $uibModal, $uibModalInstance, ProductService, UserService, CartService, ProdId) {
    $scope.avgRating = -1;
    $scope.products = ProductService.products;
    $scope.products.$loaded(function() {
            $scope.product = $filter('filter')($scope.products, {
                stub: ProdId
            }, true)[0];
            var sum = 0;
            if($scope.product.reviews) {
                for(var i = 0; i < $scope.product.reviews.length; i++) {
                    sum += $scope.product.reviews[i].rating;
                }
                $scope.avgRating = Math.round(sum / $scope.product.reviews.length);
            } else {
                $scope.avgRating = 0;
            }
        });
    $scope.addcartmod = function(product) {
        product.quantity = 1;
        CartService.addToCart(product);
        console.log(product.name);
        $uibModalInstance.close();
        //$scope.quantity = undefined;
        //$location.path("cart");
    };
    $scope.closemod = function(){
        $uibModalInstance.close();
    }
    $scope.ratyOptions = {
        half: false,
        cancel: false,
        readOnly: true,
        starOff: 'https://raw.github.com/wbotelhos/raty/master/lib/images/star-off.png',
        starOn: 'https://raw.github.com/wbotelhos/raty/master/lib/images/star-on.png'
    };
});

app.controller('ProductCtrl', function($scope, $stateParams, $filter, $location, $uibModal, ProductService, UserService, CartService) {
    $scope.products = ProductService.products;
    $scope.user = UserService.user;
    $scope.getUser = UserService.getUser;
    $scope.createProduct = UserService.CreateProduct;
    //PLAY AROUND WITH THIS FUNCTION HERE SANCHYA
    $scope.addToCart = function(product, quantity) {
        product.quantity = quantity;
        CartService.addToCart(product);
        $scope.quantity = undefined;
        $location.path("cart");
    };

    $scope.ratyOptions = {
        half: false,
        cancel: false,
        readOnly: true,
        starOff: 'https://raw.github.com/wbotelhos/raty/master/lib/images/star-off.png',
        starOn: 'https://raw.github.com/wbotelhos/raty/master/lib/images/star-on.png'
    };

    $scope.ratyNewOptions = {
        half: false,
        cancel: false,
        readOnly: false,
        starOff: 'https://raw.github.com/wbotelhos/raty/master/lib/images/star-off.png',
        starOn: 'https://raw.github.com/wbotelhos/raty/master/lib/images/star-on.png'
    };
    $scope.avgRating = -1;

    if($stateParams.id !== undefined) {
        //$scope.product = $scope.products.$getRecord($stateParams.id);
        $scope.products.$loaded(function() {
            $scope.product = $filter('filter')($scope.products, {
                stub: $stateParams.id
            }, true)[0];
            console.log($scope.product);
            var sum = 0;
            if($scope.product.reviews) {
                for(var i = 0; i < $scope.product.reviews.length; i++) {
                    sum += $scope.product.reviews[i].rating;
                }
                $scope.avgRating = Math.round(sum / $scope.product.reviews.length);
            } else {
                $scope.avgRating = 0;
            }
            
            
            console.log($scope.avgRating);
            //prototype array function
            
            //ProductService.CreateReview($scope.product, 'Great Product', 5, 'This is the body of text.');
        });
        $scope.addCategory = ProductService.AddCategory;
        $scope.newCategory = undefined;
        $scope.newReview = {};
        $scope.addReview = function() {
            ProductService.CreateReview($scope.product, $scope.newReview.title, $scope.newReview.rating, $scope.newReview.body);
            $scope.newReview = {};
        };
        $scope.removeReview = ProductService.RemoveReview;

    }
    $scope.popup = function(stub){
        var modalInstance = $uibModal.open({
               templateUrl: 'partials/product/product_modal.html',
               controller: 'ProductModal',
               resolve: {
                   ProdId : function() {
                       return stub;
                   }
               }
            });
    }

});

app.controller('CartCtrl', function($scope, $location, UserService, ProductService, CartService) {
    UserService.requireLogin($location);
    $scope.cart = CartService.cart;
    $scope.removeProduct = CartService.removeFromCart;

    $scope.process = function(cart) {
        if(cart !== undefined && cart !== null) {
            for(var i = 0; i < cart.length; i++) {
                cart[i].product = ProductService.RetrieveProduct(cart[i].id);
            }
        }
        return cart;
    }
});

app.controller('LogoutCtrl', function($scope, $location, UserService) {
    console.log('logging user out');
    UserService.logout();
    $location.path('home'); //TODO: Redirect to pre-existing page
});

app.controller('HomeCtrl', function($scope, $location, UserService, ProductService, CartService) {
    $scope.products = ProductService.products;
    $scope.user = UserService.user;
    $scope.createProduct = UserService.CreateProduct;
    $scope.addToCart = function(product, quantity) {
        product.quantity = quantity;
        CartService.addToCart(product);
        $scope.quantity = undefined;
        $location.path("cart");
    };
});

app.controller('LoginCtrl', function($scope, $uibModalInstance, UserService, $uibModal) {

    $scope.signin = function(login) {
        UserService.signin(login.email, login.password);
        $uibModalInstance.close();
    };

    $scope.close = function() {
        $uibModalInstance.close();
    };

    $scope.goToSignUp = function() {
        $uibModalInstance.close();
        var modalInstance = $uibModal.open({
            templateUrl: 'partials/user/signup.html',
            controller: 'SignUpCtrl'
        });
    };

});

app.controller('SignUpCtrl', function($scope, $uibModalInstance, UserService) {
            console.log('got here');

    $scope.createAccount = function (signup) {
        UserService.signup(signup);
        $uibModalInstance.close();
    };

    $scope.close = function() {
        $uibModalInstance.close();
    }
});


app.factory('SystemService', function() {
    var service = {};
    service.ref = new Firebase("https://fire-store.firebaseio.com");
    var callbacks = [];
    service.addCall = function(call) {
        callbacks.push(call);
    };
    service.execCalls = function() {
        callbacks.forEach(function(call) {
            call();
        });
    };
    return service;
});

app.factory('UserService', function($firebaseObject, $firebaseAuth, $location, SystemService) {
    var service = {};
    var Auth = $firebaseAuth(SystemService.ref);
    var usersRef = SystemService.ref.child('users');

    var users = $firebaseObject(usersRef);
    service.user = {};

    service.getUser = function(id) {
        return users[id];
    };

    service.signup = function (user) {
        console.log("creating user " + user.email);

        Auth.$createUser({
                'email': user.email,
                'password': user.password
            })
            .then(service.signin(user.email, user.password)).then(function (authData) {
                if (!service.user.avatar) {
                    service.user.avatar = "img/no-pic.png";
                }
                if (!service.user.name) {
                    service.user.name = user.name;
                }

                if (!service.user.recPref) {
                    service.user.recPref = user.recPref;
                }

                users[authData.uid] = {
                    'avatar': service.user.avatar,
                    'name': service.user.name,
                    'recPref': service.user.recPref
                };

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
                service.user.role = users[authData.uid].role;
            });
        } else {
            service.user.userId = undefined;
            service.user.name = undefined;
            service.user.avatar = undefined;
            service.user.role = undefined;
        }
        SystemService.execCalls();
    });

    service.isLoggedIn = function() {
        return service.user.userId !== undefined;
    };

    service.isAdmin = function() {
        return service.user.role === 'admin';
    };

    service.requireLogin = function() {
        if(!service.isLoggedIn()) {
            $location.path("/user/login");
        }
    };

    return service;
});

app.factory('ProductService', function($firebaseArray, SystemService, UserService) {
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
        obj.image = "img/placeholder.jpg";
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
            author: UserService.user.userId || 'N/A'
        };
        productRef.reviews.push(review);
        service.products.$save(productRef);
    };

    service.RemoveReview = function(product, review) {
        var productRef = service.products.$getRecord(product.$id);
        if(review.author === UserService.user.userId || UserService.isAdmin()) {
            productRef.reviews.splice(productRef.reviews.indexOf(review), 1);
        }
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

    service.reloadCart = function() {
        if(UserService.isLoggedIn()) {
            carts.$loaded(function() {
                if(carts[UserService.user.userId]) {
                    service.cart.items = carts[UserService.user.userId].items || [];
                } else {
                    service.cart.items = [];
                }
            });

        } else {
            service.cart.items = undefined; 
        }
    };

    service.reloadCart();
    SystemService.addCall(service.reloadCart);

    service.addToCart = function(product) {
        var item = {};
        item.id = product.$id;
        item.quantity = product.quantity;
        if(indexOf(item, service.cart.items) === -1) {
            service.cart.items.push(item);
        } else {
            service.cart.items[indexOf(item, service.cart.items)].quantity += item.quantity;
        }
        saveCart();
    };

    service.updateQuantity = function(product, quantity) {
        product.quantity = quantity;
        saveCart();
    };

    service.removeFromCart = function(product) {
        service.cart.items.splice(indexOf(product, service.cart.items), 1);
        saveCart();
    };

    function saveCart() {
        carts[UserService.user.userId] = service.cart;
        carts.$save();
    }

    function indexOf(o, arr) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].id == o.id) {
                return i;
            }
        }
        return -1;
    }

    return service;
});