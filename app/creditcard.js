
var harmon = require('harmon');
var concat = require('concat-stream');

exports.onRequest = function (options) {
    return function creditcardOnRequest(proxyRequest, request, response, options) {
        var path = proxyRequest.path.toLowerCase();
        if ((path.startsWith("/shoppingcart/step3")) ||
            (path.startsWith("/shoppingcart/step4")) ||
            (path.startsWith("/order/details"))) {

            response.creditcard_active_uri = 1;
        }
    }
}

exports.onResponse = function (options) {
    return function creditcardOnResponse(proxyResponse, request, response, options) {
        if (response.creditcard_active_uri) {
            var responseSelects = [];
            
            /*
            Catch visible input boxes and hidden fields:
                <input class="form-control" data-val="true" 
                ... id="CartPaymentViewModel_CardNumber" 
                ... value="4111-1111-1111-1111">
            */
            var step3cardnumber = {};
            step3cardnumber.query = '#CartPaymentViewModel_CardNumber'
            step3cardnumber.func = function (node) {
                var attr = node.getAttribute("value");
                if (attr !== "") {
                    node.setAttribute("value", "****-****-****-****");
                }
            }
            responseSelects.push(step3cardnumber);

            /*
            Catch printed card number on step4 and order details:
            <td colspan="2">
                Payment by credit card
                ****-****-****-****
                (A Card Holder)
                Exp: 01/20
            </td>
            */
            var step4cardnumber = {};
            step4cardnumber.query = "td";
            step4cardnumber.func = function (node) {

                var attr = node.getAttribute("colspan");
                if (attr === "2") {

                    //Create a read/write stream so we can check the contents
                    var stm = node.createStream();

                    //variable to hold all the info from the data events
                    var inner = '';

                    //collect all the data in the stream
                    stm.on('data', function (data) {
                        inner += data;
                    });

                    //When the read side of the stream has ended..
                    stm.on('end', function () {
                        if (inner.includes("Payment by credit card")) {
                            stm.end("Payment received by credit card");
                        } else {
                            stm.end(inner);
                        }
                    });
                }
            }
            responseSelects.push(step4cardnumber);

            var harmonfilter = harmon([], responseSelects);
            harmonfilter(null, response, function () { });
        }
    }
}
