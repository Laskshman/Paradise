'use strict';

var bloggersData;

    bloggersData = new kendo.data.DataSource({
        transport: {
            read: {
                 url: "http://localhost:8969//LocationMasterService.svc/GetLocationMasterTableByCityLookupCodeId/60",

                data: {
                    Accept: "application/json"
                }
            }
        }

    });

app.Bloggers = kendo.observable({
    onShow: function () {
         bloggersData.fetch();
    }
});
(function (parent) {
    var navigateHome = function () {
        app.mobileApp.navigate('authenticationMainView/view.html');
    };
    var bloggersViewModel = kendo.observable({
        // Logout user
        logout: function () {
            AppHelper.logout()
                .then(navigateHome, function (err) {
                    appalert.showError(err.message);
                    navigateHome();
                });
        }
    });
    parent.set('bloggersViewModel', bloggersViewModel);
})(app.pgSettings)