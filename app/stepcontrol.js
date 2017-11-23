var redis = require('redis');

/*
    Track which steps of the shopping cart have been completed, and
    block access to subsequent steps if you haven't done the pre-requisites.

    This is done in two phases. In the responses from the server, we check if
    they have successfully POSTed and redirected from each step, and set a 
    flag in redis indicating that step is complete.

    Then on each request, we check if they are requesting a step of the shopping
    cart, and check whether they have completed the previous steps.
    */

exports.onRequest = function (options) {
    return function stepcontrolOnRequest(proxyRequest, request, response, options) {

        var path = proxyRequest.path.toLowerCase();

        // Only run this redis logic for pages we need to deal with:
        if ((path.startsWith("/shoppingcart/step2")) ||
            (path.startsWith("/shoppingcart/step3")) ||
            (path.startsWith("/shoppingcart/step4")) ||
            (path.startsWith("/order")) ||
            (path.startsWith("/account/logout"))) {

            // console.log("VisitorID: " + request.VisitorId);

            var client = redis.createClient(6379, 'redis');
            client.on('connect', onRedisConnect);

            function onRedisConnect() {

                // Check if our RS object is in Redis for this visitor
                client.hgetall(request.VisitorId + "_stepcontrol", function (err, reply) {

                    // rs is an object with step_1,2,3,4 and completed fields
                    var rs = { stored: 1 };

                    if (reply) {
                        rs = reply;
                    }

                    if ((path.startsWith("/shoppingcart/step2"))) {
                        if (rs.step1 != 1) {
                            //console.log("Skipped step 1!");

                            response.writeHead(302,
                                { Location: '/ShoppingCart/Step1?Security_Violation' }
                            );
                            response.end();
                            proxyRequest.abort();
                        }
                    }

                    if ((path.startsWith("/shoppingcart/step3"))) {
                        if ((rs.step1 != 1) || (rs.step2 != 1)) {
                            //console.log("Skipped step 1 or 2!");
                            response.writeHead(302,
                                { Location: '/ShoppingCart/Step1?Security_Violation' }
                            );
                            response.end();
                            proxyRequest.abort();
                        }
                    }

                    if ((path.startsWith("/shoppingcart/step4"))) {
                        if ((rs.step1 != 1) || (rs.step2 != 1) || (rs.step3 != 1)) {
                            //console.log("Skipped step 1, 2 or 3!");
                            response.writeHead(302,
                                { Location: '/ShoppingCart/Step1?Security_Violation' }
                            );
                            response.end();
                            proxyRequest.abort();
                        }
                    }

                    // Clear the steps once the order is placed or the user logs out
                    if ((path.startsWith("/order")) ||
                        (path.startsWith("/account/logout"))) {
                        rs.step1 = 0;
                        rs.step2 = 0;
                        rs.step3 = 0;
                    }

                    client.hmset(request.VisitorId + "_stepcontrol", rs, function (err, replies) {
                        client.quit();    
                    });
                });
            }
        }
    }
}

exports.onResponse = function (options) {

    return function stepcontrolOnResponse(proxyResponse, request, response, options) {

        var path = request.url.toLowerCase();

        if ((path.startsWith("/shoppingcart/updatequantities")) ||
            (path.startsWith("/shoppingcart/updateaddress")) ||
            (path.startsWith("/shoppingcart/updatepayment")) ||
            (path.startsWith("/shoppingcart/processorder"))) {

            // console.log("VisitorID: " + request.VisitorId);

            var client = redis.createClient(6379, 'redis');
            client.on('connect', onRedisConnect);

            function onRedisConnect() {

                // Check if our RS object is in Redis for this visitor
                client.hgetall(request.VisitorId + "_stepcontrol", function (err, reply) {

                    // rs is an object with step_1,2,3,4 and completed fields
                    var rs = { stored: 1 };

                    if (reply) {
                        rs = reply;
                    }

                    if ((request.method == "POST") &&
                        (proxyResponse.statusCode == 302)) {

                        if ((path.startsWith("/shoppingcart/updatequantities"))) {
                            rs.step1 = 1;
                        }

                        if ((path.startsWith("/shoppingcart/updateaddress"))) {
                            // Too early, should be done in response:
                            rs.step2 = 1;
                        }

                        if ((path.startsWith("/shoppingcart/updatepayment"))) {
                            rs.step3 = 1;
                        }

                        // Once the order is processed, reset the step counters
                        if ((path.startsWith("/shoppingcart/processorder"))) {
                            rs.step1 = 0;
                            rs.step2 = 0;
                            rs.step3 = 0;
                        }

                        client.hmset(request.VisitorId + "_stepcontrol", rs, function (err, replies) {
                            client.quit();    
                        });
                    }
                });
            };
        }
    }
}
