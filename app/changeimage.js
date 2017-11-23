exports.onRequest = function(options) {

    return function changeImageOnRequest (proxyRequest, request, response, options) {
        if (proxyRequest.path == "/images/0days.png") {
            proxyRequest.path = "/images/fixed.png";
        }
    }
}
