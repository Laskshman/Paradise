'use strict';

app.authenticationView = kendo.observable({
    onShow: function () {}
});
(function (parent) {
    var provider = app.data.defaultProvider,
        mode = 'signin',
        registerRedirect = 'home',
        signinRedirect = 'home',
        init = function (error) {
            if (error) {
                if (error.message) {
                    alert(error.message);
                }
                return false;
            }

            var activeView = mode === 'signin' ? '.signin-view' : '.signup-view';

            if (provider.setup && provider.setup.offlineStorage && !app.isOnline()) {
                $('.offline').show().siblings().hide();
            } else {
                $(activeView).show().siblings().hide();
            }
        },
        successHandler = function (data) {
            var redirect = mode === 'signin' ? signinRedirect : registerRedirect;

            if (data && data.result) {
                app.user = data.result;
                app.mobileApp.navigate(redirect + '/view.html');
            } else {
                init();
            }
        },
        authenticationViewModel = kendo.observable({
            displayName: '',
            email: '',
            userName: '',
            password: '',
            passwordSalt: '',
            mobileNo: '',
            birthDate: new Date(),
            gender: '0',
            validateData: function (data) {
                if (!data.userName) {
                    appalert.showAlert('Missing Name');
                    //alert('Missing User Name');
                    return false;
                }
                if (!data.password) {
                    appalert.showAlert('Missing Password');
                    //alert('Missing password');
                    return false;
                }

                return true;
            },
            validateDataRegister: function (data) {
                if (!data.displayName) {
                    appalert.showAlert('Missing Name');
                    //alert('Missing email');
                    return false;
                }
                if (!data.email) {
                    appalert.showAlert('Missing email');
                    //alert('Missing email');
                    return false;
                }
                if (!data.password) {
                    appalert.showAlert('Missing password');
                    //alert('Missing password');
                    return false;
                }
                if (data.password !== data.passwordSalt) {
                    appalert.showAlert('Confirm Password Mismatch');
                    //alert('Confirm Password Mismatch');
                    return false;
                }
                if (!data.mobileNo) {
                    appalert.showAlert('Missing Mobile No');
                    //alert('Missing Mobile No');
                    return false;
                }
                if (!data.userName) {
                    appalert.showAlert('Missing User Name');
                    //alert('Missing User Name');
                    return false;
                }
                return true;
            },
            signin: function () {
                var model = authenticationViewModel,
                    userName = model.userName,
                    password = model.password;

                if (!model.validateData(model)) {
                    return false;
                }
                provider.Users.login(userName, password, successHandler, init);
            },
            register: function () {
                var model = authenticationViewModel,
                    email = model.email.toLowerCase(),
                    password = model.password,
                    displayName = model.displayName,
                    userName = model.userName,
                    gender = model.gender,
                    birthDate = model.birthDate,
                    attrs = {
                        Email: email,
                        DisplayName: displayName,
                        Username: userName,
                        Gender: gender,
                        BirthDate: birthDate,
                    };
                if (!model.validateDataRegister(model)) {
                    return false;
                }
                provider.Users.register(email, password, attrs)
                    .then(function () {
                            appalert.showAlert('Registration successful');
                            app.mobileApp.navigate('authenticationMainView/view.html');
                        },
                        function (err) {
                            appalert.showError(err.message);
                        });
            },
            toggleView: function () {
                mode = mode === 'signin' ? 'register' : 'signin';
                init();
            },
            onSelectChange: function () {
                var selected = sel.options[sel.selectedIndex].value;
                sel.style.color = (selected === 0) ? '#b6c5c6' : '#34495e';
            },
            forgot: function () {                
                if (!this.authenticationViewModel.email && !this.authenticationViewModel.mobileNo) {
                    appalert.showError('Email address Or Mobile No is required.');
                    return;
                }
                if (this.authenticationViewModel.mobileNo) {                    
                    authenticationViewModel.getUserdetails(this.authenticationViewModel.mobileNo);
                    return;
                }                                
                var apiKey = appsettings.everlive.apiKey;
                $.ajax({
                    type: "POST",
                    url: "https://api.everlive.com/v1/" + apiKey + "/Users/resetpassword",
                    contentType: "application/json",
                    data: JSON.stringify({
                        Email: this.authenticationViewModel.email
                    }),
                    success: function () {
                        appalert.showError('Your password was successfully reset. Please check your email for instructions on choosing a new password.');
                        // navigator.notification.alert("Your password was successfully reset. Please check your email for instructions on choosing a new password.");
                        app.mobileApp.navigate('authenticationMainView/view.html');
                        // window.location.href = "authenticationMainView/view.html";
                    },
                    error: function () {
                        appalert.showError('Unfortunately, an error occurred resetting your password.');
                        //navigator.notification.alert("Unfortunately, an error occurred resetting your password.")
                    }
                });
            },
            sendNonInteractiveSMS: function (mobileno,resetpwd) {                           
                var resetpwdmsg = 'Your Reset Password Is ' + resetpwd;                
                var MobileNo = "+91" + mobileno;                      
                if (!authenticationViewModel.checkSimulator()) {
                    var options = {
                        android: {
                            intent: ''
                        }
                    };
                    window.sms.send(MobileNo, resetpwdmsg, options, authenticationViewModel.onSuccess, authenticationViewModel.onError);                    
                }
            },
            getUserdetails: function (mobileNo) {                                
                var filter = {
                    "MobileNo": mobileNo
                };
                var apiKey = appsettings.everlive.apiKey;
                //Ajax request using jQuery
                $.ajax({
                    url: "http://api.everlive.com/v1/" + apiKey + "/Users",
                    type: "GET",
                    headers: {
                        "X-Everlive-Filter": JSON.stringify(filter)
                    },
                    success: function (data) {                        
                        var username= data.Result[0].Username;
                        var mobileno= data.Result[0].MobileNo;
                        var resetpwd = authenticationViewModel.randompassword();
                        var parameters="?username="+ username +"&newPassword="+resetpwd;                        
                        $.ajax({
                            type: "GET",
                            url: "https://api.everlive.com/v1/" + apiKey + "/functions/ResetPassword"+ parameters,
                            contentType: "application/json",                            
                            success: function (data) {                                
                                appalert.showAlert('Your password was successfully reset. SMS is sent to your Registered Mobile Number ');                                                               	
                                //app.mobileApp.navigate('authenticationMainView/view.html');       
                                authenticationViewModel.sendNonInteractiveSMS(mobileno,resetpwd);
                                //authenticationViewModel.forgotView();
                            },
                            error: function () {                                
                                appalert.showError('Unfortunately, an error occurred resetting your password.');                               
                            }
                        });                                              
                    },
                    error: function (error) {                        
                        alert(JSON.stringify(error));
                    }
                });
            },            
            randompassword: function () {
                var alpha = new Array('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z');
                var i;
                for (i = 0; i < 6; i++) {
                    var a = alpha[Math.floor(Math.random() * alpha.length)];
                    var b = alpha[Math.floor(Math.random() * alpha.length)];
                    var c = alpha[Math.floor(Math.random() * alpha.length)];
                    var d = alpha[Math.floor(Math.random() * alpha.length)];
                    var e = alpha[Math.floor(Math.random() * alpha.length)];
                    var f = alpha[Math.floor(Math.random() * alpha.length)];
                    var g = alpha[Math.floor(Math.random() * alpha.length)];
                    var h = alpha[Math.floor(Math.random() * alpha.length)];
                }
                var code = a + b + c + d + e + f + g + h;
                return code;
            },
            checkSimulator: function () {
                if (window.navigator.simulator === true) {
                    alert('This plugin is not available in the simulator.');
                    return true;
                } else if (window.sms === undefined) {
                    alert('Plugin not found. Maybe you are running in AppBuilder Companion app which currently does not support this plugin.');
                    return true;
                } else {
                    return false;
                }
            },
            // callbacks (wrapping alerts in a timeout, because they would otherwise freeze the UI on iOS)
            onSuccess: function (msg) {
                setTimeout(function () {
                    alert('SMS success: ' + msg);
                }, 1);
            },
            onError: function (msg) {
                setTimeout(function () {
                    alert('SMS error: ' + msg);
                }, 1);
            },
            forgotView: function () {
                $("#forgot").data("kendoMobileModalView").close();
                this.authenticationViewModel.email="";
                this.authenticationViewModel.mobileNo="";                
            },
            signupFacebook: function () {                
                alert("Clicked the Facebook");
                var isFacebookLogin = AppHelper.isKeySet(appsettings.facebook.appId) && AppHelper.isKeySet(appsettings.facebook.redirectUri);
                if (!isFacebookLogin) {
                    appalert.showError('Facebook App ID and/or Redirect URI not set. You cannot use Facebook login.');
                    // alert('Facebook App ID and/or Redirect URI not set. You cannot use Facebook login.');
                    return;
                }
                if (isInMistSimulator) {
                    appalert.showError(appsettings.messages.mistSimulatorAlert);
                    return;
                }
                var facebookConfig = {
                    name: 'Facebook',
                    loginMethodName: 'loginWithFacebook',
                    endpoint: 'https://www.facebook.com/dialog/oauth',
                    response_type: 'token',
                    client_id: appsettings.facebook.appId,
                    redirect_uri: appsettings.facebook.redirectUri,
                    access_type: 'online',
                    scope: 'email',
                    display: 'touch'
                };
                var facebook = new IdentityProvider(facebookConfig);
                app.mobileApp.showLoading();
                facebook.getAccessToken(function (token) {
                    provider.everlive.Users.loginWithFacebook(token, function (data) {
                            alert(JSON.stringify(data));
                        }, function (error) {
                            alert(JSON.stringify(error));
                        })
                        .then(function () {
                            // EQATEC analytics monitor - track login type
                            // if (isAnalytics) {
                            //     analytics.TrackFeature('Login.Facebook');
                            // }
                            return provider.Users.load();
                        })
                        .then(function () {
                            app.mobileApp.hideLoading();
                            app.mobileApp.navigate('home/view.html');
                        })
                        .then(null, function (err) {
                            app.mobileApp.hideLoading();
                            if (err.code === 214) {
                                appalert.showError('The specified identity provider is not enabled in the backend portal.');
                            } else {
                                appalert.showError(err.message);
                            }
                        });
                });
            },
            signupGoogle: function () {
                var isGoogleLogin = AppHelper.isKeySet(appsettings.google.clientId) && AppHelper.isKeySet(appsettings.google.redirectUri);
                if (!isGoogleLogin) {
                    alert('Google Client ID and/or Redirect URI not set. You cannot use Google login.');
                    return;
                }
                if (isInMistSimulator) {
                    appalert.showError(appsettings.messages.mistSimulatorAlert);
                    return;
                }
                var googleConfig = {
                    name: 'Google',
                    loginMethodName: 'loginWithGoogle',
                    endpoint: 'https://accounts.google.com/o/oauth2/auth',
                    response_type: 'token',
                    client_id: appsettings.google.clientId,
                    redirect_uri: appsettings.google.redirectUri,
                    scope: 'https://www.googleapis.com/auth/userinfo.profile',
                    access_type: 'online',
                    display: 'touch'
                };
                var google = new IdentityProvider(googleConfig);
                app.mobileApp.showLoading();

                google.getAccessToken(function (token) {
                    provider.everlive.Users.loginWithGoogle(token)
                        .then(function () {
                            // EQATEC analytics monitor - track login type
                            // if (isAnalytics) {
                            //     analytics.TrackFeature('Login.Google');
                            // }
                            return provider.Users.load();
                        })
                        .then(function () {
                            app.mobileApp.hideLoading();
                            app.mobileApp.navigate('home/view.html');
                        })
                        .then(null, function (err) {
                            app.mobileApp.hideLoading();
                            if (err.code === 214) {
                                appalert.showError('The specified identity provider is not enabled in the backend portal.');
                            } else {
                                appalert.showError(err.message);
                            }
                        });
                });
            }
        });

    parent.set('authenticationViewModel', authenticationViewModel);
    parent.set('onShow', function () {
        provider.Users.currentUser().then(successHandler, init);
    });
})(app.authenticationView);