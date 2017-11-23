
var harmon = require('harmon');

exports.onRequest = function(options) {
    return function autocompleteOnRequest (proxyRequest, request, response, options) {
        if ((proxyRequest.path.toLowerCase().startsWith("/account/login")) || 
            (proxyRequest.path.toLowerCase().startsWith("/account/register")) ||
        (proxyRequest.path.toLowerCase().startsWith("/manage/changepassword"))) {
            response.autocomplete_active_uri = 1;
        }
    }
}

exports.onResponse = function (options) {  
    return function autocompleteOnResponse (proxyResponse, request, response, options) {
        if (response.autocomplete_active_uri) {
            var responseSelects = [];
            var simpleselect = {};

            // Find all password fields and add the autocomplete=off attribute
            simpleselect.query = 'input[type=password]';
            simpleselect.func = function (node) {
                node.setAttribute('autocomplete','off');
            }

            responseSelects.push(simpleselect);

            var harmonfilter = harmon([], responseSelects);
            harmonfilter(null, response, function(){});
        }
    }
}
