'use strict'
var upsample = {};

upsample.poolData = {
    UserPoolId: 'UserPool Id',
    ClientId: 'Client Id'
};
upsample.UserPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(upsample.poolData);

upsample.signup = function() {
    var email = $('#inputEmail').val();
    var username = $('#inputUserName').val();
    var password = $('#inputPassword').val();
    if (!email | !username | !password) { return false; }

    var attributeEmail = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserAttribute({Name: 'email', Value: email});
    var attributeList = [];
    attributeList.push(attributeEmail);

    var message_text;
    upsample.UserPool.signUp(username, password, attributeList, null, function(err, result){
        if (err) {
            console.log(err);
            message_text = err;
        } else {
            var cognitoUser = result.user;
            console.log('user name is ' + cognitoUser.getUsername());

            message_text = cognitoUser.getUsername() + ' is created';
        }
        $('#message').text(message_text);
        $('#message').show();
    });
}

upsample.verify = function() {
    var username = $('#inputUserName').val();
    var vericode = $('#inputVerificationCode').val();
    if (!username | !vericode) { return false; }

    var userData = {
        Username: username,
        Pool: upsample.UserPool
    };

    var message_text;
    var cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);
    cognitoUser.confirmRegistration(vericode, true, function(err, result) {
        if (err) {
            console.log(err);
            message_text = err;
            $('#message').text(message_text);
            $('#message').append($('<a href="resend.html">resend</a>')); // show resend link
        } else {
            console.log('call result ' + result);

            message_text = cognitoUser.getUsername() + ' is confirmed';
            $('#message').text(message_text);
        }
        $('#message').show();
    });
}


upsample.resend = function() {
    var username = $('#inputUserName').val();
    if (!username) { return false; }

    var userData = {
        Username: username,
        Pool: upsample.UserPool
    };

    var message_text;
    var cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);
    cognitoUser.resendConfirmationCode(function(err, result) {
        if (err) {
            console.log(err);
            message_text = err;
        } else {
            console.log('call result ' + result);

            message_text = 're-sent verification code';
        }
        $('#message').text(message_text);
        $('#message').show();
    });
}

upsample.signin = function() {
    var username = $('#inputUserName').val();
    var password = $('#inputPassword').val();
    if (!username | !password) { return false; }

    var authenticationData = {
        Username: username,
        Password: password
    };
    var authenticationDetails = new AWSCognito.CognitoIdentityServiceProvider.AuthenticationDetails(authenticationData);

    var userData = {
        Username: username,
        Pool: upsample.UserPool
    };

    var message_text;
    var cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);
    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function(result) {
            console.log('access token + ' + result.getAccessToken().getJwtToken());

            // you need to update if you want to use IdentityPool
            AWS.config.region = 'ap-northeast-3'; //
            AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                IdentityPoolId: 'IdentityPool ID', //
                Logins: {
                    'cognito-idp.<region>.amazonaws.com/<userpool ID>': result.getIdToken().getJwtToken() // 
                }
            });
            
            AWS.config.credentials.refresh(function(err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("success");
                    console.log("id:" + AWS.config.credentials.identityId);                    
                }

                $(location).attr('href', 'mypage.html');
            });
            //console.log("id:" + AWS.config.credentials.identityId);
            
            //$(location).attr('href', 'mypage.html');
        },

        onFailure: function(err) {
            alert(err);
        }
    });

}

upsample.checkSession = function () {

    var cognitoUser = upsample.UserPool.getCurrentUser();
    if (cognitoUser != null) {
        cognitoUser.getSession(function (err, sessionResult) {
            if (sessionResult) {
                var attrs;
                cognitoUser.getUserAttributes(function (err, attrs) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    $('#username').text('Username:' + cognitoUser.getUsername());

                    for (var i = 0; i < attrs.length; i++) {
                        console.log('name:' + attrs[i].getName() + ", value: " + attrs[i].getValue() );
                        if (attrs[i].getName() == 'email') {
                            $('#email').text('Email: ' + attrs[i].getValue());
                        }
                    }
                });
            } else {
                console.log("session is invalid");
                $(location).attr('href', 'login.html');
            }

        });
    } else {
        console.log("no user");
        $(location).attr('href', 'login.html');
    }
}

upsample.logout = function() {

    var cognitoUser = upsample.UserPool.getCurrentUser();
    if (cognitoUser != null) {
        cognitoUser.signOut();
        location.reload();
    }

}
