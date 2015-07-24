'use strict';

(function() {
    app.data.defaultProvider = new Everlive({
        offlineStorage: true,
        apiKey: '6RYwz3DRdJLpLrCF',
        url: '//platform.telerik.com/bs-api/v1/',
        scheme: 'https'
    });

    document.addEventListener("online", function() {
        app.data.defaultProvider.offline(false);
        app.data.defaultProvider.sync();
    });

    document.addEventListener("offline", function() {
        app.data.defaultProvider.offline(true);
    });

}());