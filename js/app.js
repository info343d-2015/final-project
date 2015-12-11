'use strict';

var app = angular.module('FireStore', ['ui.router', 'ui.bootstrap', 'firebase', 'ngRaty', 'credit-cards']);

// configures the states and routes for the application
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
        .state('orders', {
            url: '/user/orders',
            templateUrl: 'partials/user/orders.html',
            controller: 'OrderCtrl'
        })
        .state('product-list', {
            url: '/products',
            templateUrl: 'partials/product/product-list.html',
            controller: 'ProductCtrl'
        })
        .state('product-search', {
            url: '/products/q={query}',
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
        })
        .state('payment', {
            url: '/cart/payment',
            templateUrl: 'partials/checkout/payment.html',
            controller: 'CheckoutCtrl'
        })
        .state('address', {
            url: '/cart/shipping-address',
            templateUrl: 'partials/checkout/address.html',
            controller: 'CheckoutCtrl'
        })
        .state('complete', {
            url: '/cart/checkout-complete',
            templateUrl: 'partials/checkout/checkout-complete.html',
            controller: 'CheckoutCtrl'
        });
    //routes straight to home page if invalid route is typed in
    $urlRouterProvider.otherwise('/');
});

// Defines information for the header
app.controller('HeaderCtrl', function($scope, $location, UserService) {
    $scope.user = UserService.user;
    $scope.signIn = UserService.loginModal;
});

//controller for the quick view pop up modal functionality
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
        $uibModalInstance.close();
    };

    $scope.closemod = function(){
        $uibModalInstance.close();
    };

    $scope.ratyOptions = {
        half: false,
        cancel: false,
        readOnly: true,
        starOff: 'https://raw.github.com/wbotelhos/raty/master/lib/images/star-off.png',
        starOn: 'https://raw.github.com/wbotelhos/raty/master/lib/images/star-on.png'
    };

});

// Controller for the Product List and Detail Page
app.controller('ProductCtrl', function($scope, $stateParams, $filter, $location, $uibModal, ProductService, UserService, CartService) {
    $scope.products = ProductService.products;
    $scope.user = UserService.user;
    $scope.getUser = UserService.getUser;
    $scope.categories = [];
    $scope.createProduct = ProductService.CreateProduct;
    $scope.addToCart = function(product, quantity) {
        product.quantity = quantity;
        CartService.addToCart(product);
        $scope.quantity = undefined;
    };

    $scope.searchQuery = $stateParams.query;
    $scope.searchFilter = "";
    $scope.sortingCriteria = "name";

    $scope.updateList = function(category) {
        $scope.searchFilter = category;
    };

    // Creates a list of categories based on the products
    $scope.products.$loaded(function() {
        for(var i = 0; i < $scope.products.length; i++) {
            if($scope.products[i].categories) {
                for(var j = 0; j < $scope.products[i].categories.length; j++) {
                    var current = $scope.products[i].categories[j];
                    if($scope.categories.indexOf(current) == -1) {
                        $scope.categories.push(current);
                    }
                }
            }
        }
    });

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

    // Loads data for a single product if an id is specified
    if($stateParams.id !== undefined) {
        //$scope.product = $scope.products.$getRecord($stateParams.id);
        $scope.products.$loaded(function() {
            $scope.product = $filter('filter')($scope.products, {
                stub: $stateParams.id
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
        $uibModal.open({
               templateUrl: 'partials/product/product_modal.html',
               controller: 'ProductModal',
               resolve: {
                   ProdId : function() {
                       return stub;
                   }
               }
            });
    };

});

//controller for the shopping cart functionalities
app.controller('CartCtrl', function($scope, $location, UserService, ProductService, CartService) {

    UserService.requireLogin(null, function() {
        $uibModal.open({
            templateUrl: 'partials/user/auth-error.html',
            controller: 'AuthErrorCtrl',
            resolve: {
                options: function() {
                    var service = {};
                    service.message = "You must login to access your cart!";
                    return service;
                }
            }
        });
        $location.path('home');
    });

    $scope.cart = CartService.cart;
    $scope.removeProduct = CartService.removeFromCart;

    $scope.increaseQty = function(item, quantity) {
        quantity++;
        CartService.updateQuantity(item, quantity);
    };

    $scope.decreaseQty = function(item, quantity) {
        quantity--;
        CartService.updateQuantity(item, quantity);
    };

    // Loads the full details for each product in the cart
    $scope.process = function(cart) {
        if(cart !== undefined && cart !== null) {
            for(var i = 0; i < cart.length; i++) {
                cart[i].product = ProductService.RetrieveProduct(cart[i].id);
            }
        }
        return cart;
    };

    $scope.Total = function(){
            var count = 0;
            if($scope.cart.items) {
                for(var i = 0; i < $scope.cart.items.length; i++){
                    var item = $scope.cart.items[i];
                    count += item.product.price * item.quantity;
                }
                CartService.cart.total = count;
            }
            return count;
        }
});

// Controller to log the user out
app.controller('LogoutCtrl', function($scope, $location, UserService) {
    UserService.logout();
    $location.path('home');
});

// Controller for the home page
app.controller('HomeCtrl', function($scope, $location, $uibModal, UserService, ProductService, CartService) {
    $scope.products = ProductService.products;
    $scope.user = UserService.user;
    $scope.addToCart = function(product, quantity) {
        product.quantity = quantity;
        CartService.addToCart(product);
        $scope.quantity = undefined;
    };

    $scope.popup = function(stub){
        $uibModal.open({
            templateUrl: 'partials/product/product_modal.html',
            controller: 'ProductModal',
            resolve: {
                ProdId : function() {
                    return stub;
                }
            }
        });
    };
});

// Controller to handle user login
app.controller('LoginCtrl', function($scope, $uibModalInstance, options, UserService) {

    $scope.btnCancel = options.btnCancel || false;

    $scope.signin = function(login) {
        UserService.signin(login.email, login.password).then(function() {
            if(options.successCall && typeof options.successCall === 'function') options.successCall();
        });
        $uibModalInstance.close();
    };

    $scope.close = function() {
        $uibModalInstance.close();
        if(options.errorCall) options.errorCall();
    };

    $scope.goToSignUp = function() {
        $uibModalInstance.close();
        UserService.signupModal($scope.btnCancel, options.successCall, options.errorCall);
    };

});

// Controller to handle user signup
app.controller('SignUpCtrl', function($scope, $uibModalInstance, options, UserService) {
    $scope.btnCancel = options.btnCancel || false;

    $scope.createAccount = function (signup) {
        UserService.signup(signup, function() {
            if(options.successCall && typeof options.successCall === 'function') options.successCall();
        });
        $uibModalInstance.close();
    };

    $scope.close = function() {
        $uibModalInstance.close();
        if(options.errorCall) options.errorCall();
    }
});

// Controller for previous user orders
app.controller('OrderCtrl', function($scope, $filter, UserService, OrderService) {
    $scope.previous = OrderService.previous;
    $scope.asDate = function(input) {
        return new Date(input);
    };
});

// Controller to check the user out
app.controller('CheckoutCtrl', function($scope, UserService, CartService, OrderService) {
    $scope.order = OrderService.order;

    $scope.addOrder = function() {
        $scope.order.cart = CartService.cart;
        $scope.order.owner = UserService.user.userId;
        $scope.order.orderDate = (new Date()).toString();
        OrderService.addOrder($scope.order);
        $scope.order = {};
        CartService.clearCart();
    };
});

// Controller for the modal to confirm the item has been added to cart
app.controller('InCartCtrl', function($scope, $uibModalInstance) {
    $scope.closeModal = function() {
        $uibModalInstance.close();
    };
});

// Controller for the modal if there is an authentication error
app.controller('AuthErrorCtrl', function($scope, $uibModalInstance, options) {
    $scope.message = options.message;
    $scope.closeModal = function() {
        $uibModalInstance.close();
    }
});

// System Service to handle basic connections with firebase, and refresh callbacks
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

// User Service handles user authentication, and other information related to accounts
app.factory('UserService', function($firebaseObject, $firebaseAuth, $location, $uibModal, SystemService) {
    var service = {};
    var Auth = $firebaseAuth(SystemService.ref);
    var usersRef = SystemService.ref.child('users');
    var requiredLogin = false;
    var accountCreated = false;

    var users = $firebaseObject(usersRef);
    service.$loaded = users.$loaded;
    service.user = {};

    service.getUser = function(id) {
        return users[id];
    };

    // Creates an account for the user, with an optional callback on success
    service.signup = function (user, callback) {
        accountCreated = true;
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
                    service.user.recPref = user.recPref || 'None';
                }

                users[authData.uid] = {
                    'avatar': service.user.avatar,
                    'name': service.user.name,
                    'recPref': service.user.recPref
                };

                users.$save();

                service.user.userId = authData.uid;
            }).then(service.reloadCart).then(callback)
            .catch(function (error) {
                $uibModal.open({
                    templateUrl: 'partials/user/auth-error.html',
                    controller: 'AuthErrorCtrl',
                    resolve: {
                        options: function() {
                            var service = {};
                            service.message = "We could not create an account for you.  Please try again";
                            return service;
                        }
                    }
                });
                $location.path('home');
            });
    };

    // Signs the user in
    service.signin = function (email, password) {
        return Auth.$authWithPassword({
            'email': email,
            'password': password
        }).catch(function(error) {
            if(!accountCreated) {
                $uibModal.open({
                    templateUrl: 'partials/user/auth-error.html',
                    controller: 'AuthErrorCtrl',
                    resolve: {
                        options: function() {
                            var service = {};
                            service.message = "We could not sign you in.  Please try again";
                            return service;
                        }
                    }
                });
            }
            $location.path('home');
        });
    };

    // Logs the user out
    service.logout = function () {
        Auth.$unauth();
        if(accountCreated) {
            clearUserData();
            accountCreated = false;
        }
    };

    // Performs backend refresh on user data on login/logout
    Auth.$onAuth(function (authData) {
        if (authData) {
            service.user.userId = authData.uid;
            users.$loaded(function() {
                service.user.name = users[authData.uid].name;
                service.user.recPref = users[authData.uid].recPref;
                service.user.avatar = users[authData.uid].avatar;
                service.user.role = users[authData.uid].role;
            });
        } else {
            clearUserData();
        }
        SystemService.execCalls();
    });

    var clearUserData = function() {
        service.user.userId = undefined;
        service.user.name = undefined;
        service.user.recPref = undefined;
        service.user.avatar = undefined;
        service.user.role = undefined;
    };

    service.isLoggedIn = function() {
        return service.user.userId !== undefined;
    };

    service.isAdmin = function() {
        return service.user.role === 'admin';
    };

    // Requires the user to login prior to accessing a page, with optional success and error callbacks
    service.requireLogin = function(successCall, errorCall) {
        users.$loaded(function() {
            if(!service.isLoggedIn()) {
                if(!requiredLogin) {
                    requiredLogin = true;
                    var success = function() {
                        if(successCall && typeof successCall === 'function') successCall();
                        requiredLogin = false;
                    };
                    var error = function() {
                        if(errorCall && typeof errorCall === 'function') errorCall();
                        requiredLogin = false;
                    };
                    service.loginModal(false, success, error);
                }
            } else {
                if(successCall && typeof successCall === 'function') successCall();
                requiredLogin = false;
            }
        });
    };

    // Displays a login modal
    service.loginModal = function(disableCancel, successCall, errorCall) {
        $uibModal.open({
            templateUrl: 'partials/user/login.html',
            controller: 'LoginCtrl',
            backdrop: 'static',
            resolve: {
                options: function() {
                    var service = {};
                    service.btnCancel = disableCancel;
                    service.successCall = successCall;
                    service.errorCall = errorCall;
                    return service;
                }
            }
        });
    };

    // Displays a signup modal
    service.signupModal = function(disableCancel, successCall, errorCall) {
        $uibModal.open({
            templateUrl: 'partials/user/signup.html',
            controller: 'SignUpCtrl',
            backdrop: 'static',
            resolve: {
                options: function() {
                    var service = {};
                    service.btnCancel = disableCancel;
                    service.successCall = successCall;
                    service.errorCall = errorCall;
                    return service;
                }
            }
        });
    };

    return service;
});

// Product Service deals with backend service functionality for products, categories, and reviews
app.factory('ProductService', function($firebaseArray, SystemService, UserService) {
    var service = {};
    var productsRef = SystemService.ref.child('products');
    service.categories = [];
    service.products = $firebaseArray(productsRef);

    // refreshes the available categories
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

    // Creates a new product
    service.CreateProduct = function(name, description, price, manufacturer, image) {
        var obj = {};
        obj.name = name;
        obj.description = description;
        obj.price = price;
        obj.reviews = [];
        obj.stock = 0;
        obj.image = image || "img/placeholder.jpg";
        obj.manufacturer = manufacturer;
        obj.stub = name.toLowerCase().replace(/ /g,"-");
        service.products.$add(obj);
    };

    // Creates a new review
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

    // Removes an existing review
    service.RemoveReview = function(product, review) {
        var productRef = service.products.$getRecord(product.$id);
        if(review.author === UserService.user.userId || UserService.isAdmin()) {
            productRef.reviews.splice(productRef.reviews.indexOf(review), 1);
        }
        service.products.$save(productRef);
    };

    // Adds a category to a product
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

    // Retrieves a product based on its ID
    service.RetrieveProduct = function(id) {
        return service.products.$getRecord(id);
    };

    return service;
});

// Cart Service saves any items to a cart associated with the user, allowing them to access it later
app.factory('CartService', function($firebaseObject, $uibModal, SystemService, UserService) {
    var service = {};
    var cartsRef = SystemService.ref.child('carts');
    var carts = $firebaseObject(cartsRef);

    service.cart = {};

    // Refreshes the user's cart
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
            service.cart.items = [];
        }
    };

    service.reloadCart();
    SystemService.addCall(service.reloadCart);

    // Empties the user's cart
    service.clearCart = function() {
        carts.$loaded(function() {
            service.cart.items = [];
            saveCart();
        });
    };

    // Adds an item to a user's cart, merging if it already exists
    service.addToCart = function(product) {
        UserService.requireLogin(function() {
            carts.$loaded(function() {
                var item = {};
                item.id = product.$id;
                item.quantity = product.quantity;
                if(indexOf(item, service.cart.items) === -1) {
                    service.cart.items.push(item);
                } else {
                    service.cart.items[indexOf(item, service.cart.items)].quantity += item.quantity;
                    if (service.cart.items[indexOf(item, service.cart.items)].quantity > 1000) {
                        service.cart.items[indexOf(item, service.cart.items)].quantity = 1000;
                    }
                }
                $uibModal.open({
                    templateUrl: 'partials/cart/incart-modal.html',
                    controller: 'InCartCtrl'
                });
                saveCart();
            });
        }, function() {
            $uibModal.open({
                templateUrl: 'partials/user/auth-error.html',
                controller: 'AuthErrorCtrl',
                resolve: {
                    options: function() {
                        var service = {};
                        service.message = "You must login before adding to your cart!";
                        return service;
                    }
                }
            });
        });
    };

    // Updates the quantity of an item in the cart
    service.updateQuantity = function(product, quantity) {
        product.quantity = quantity;
        if (product.quantity > 1000) {
            product.quantity = 1000;
        } else if (product.quantity < 1) {
            product.quantity = 1;
        }
        saveCart();
    };

    // Removes an item for the user's cart
    service.removeFromCart = function(product) {
        service.cart.items.splice(indexOf(product, service.cart.items), 1);
        saveCart();
    };

    // Saves the cart to Firebase, stripping away excess data
    function saveCart() {
        var finalCart = {};
        finalCart.items = [];
        service.cart.items.forEach(function(item) {
            var obj = {};
            obj.id = item.id;
            obj.quantity = item.quantity;
            finalCart.items.push(obj);
        });
        carts[UserService.user.userId] = finalCart;
        carts.$save();
    }

    // Returns the index of an object in an array based on its ID
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

// Order Service deals with retrieving and saving orders once the user has checked out
app.factory('OrderService', function($firebaseArray, $filter, SystemService, UserService) {
    var service = {};
    var ordersRef = SystemService.ref.child('orders');
    var orders = $firebaseArray(ordersRef);

    service.order = {};
    service.previous = {};

    // Adds an order to the system
    service.addOrder = function(order) {
        orders.$add(order);
    };

    // Refreshes the list of orders
    var refreshOrders = function() {
        if(UserService.isLoggedIn()) {
            orders.$loaded(function() {
                service.previous.orders = $filter('filter')(orders, {
                        owner: UserService.user.userId
                    }, true) || [];
            });
        } else {
            service.previous.orders = [];
        }
    };

    SystemService.addCall(refreshOrders);
    refreshOrders();

    return service;
});

app.filter("emptyToEnd", function () {
    return function (array, key) {
        if(!angular.isArray(array)) return;
        var present = array.filter(function (item) {
            return item[key];
        });
        var empty = array.filter(function (item) {
            return !item[key]
        });
        return present.concat(empty);
    };
});