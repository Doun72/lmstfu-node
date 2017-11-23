var redis = require('redis');
var harmon = require('harmon');
var concat = require('concat-stream');

/*
    */

exports.onRequest = function (options) {
    return function ordercontrolOnRequest(proxyRequest, request, response, options) {
        var path = proxyRequest.path.toLowerCase();

        if ((path === "/order") ||
            (path.startsWith("/order?"))) {
            response.ordercontrol_active_uri = 1;
        }

        // Only run this redis logic for pages we need to deal with:
        if ((path.startsWith("/order/details")) ||
            (path.startsWith("/account/logout"))) {

            var client = redis.createClient(6379, 'redis');
            client.on('connect', onRedisConnect);

            function onRedisConnect() {

                // Check if our RS object is in Redis for this visitor
                client.hgetall(request.VisitorId + "_ordercontrol", function (err, reply) {

                    // rs is an object with step_1,2,3,4, allowedOrderIDs and completed fields
                    var rs = { stored: 1 };

                    if (reply) {
                        rs = reply;
                    }

                    // Test if the requested order ID is stored in redis as an allowed ID
                    if ((path.startsWith("/order/details"))) {
                        if ("allowedOrderIDs" in rs) {

                            var re = new RegExp("id=(\\d+)");
                            var match = re.exec(path);

                            var requestedID = 0;

                            if (match) {
                                requestedID = match[1];
                            }

                            var allowedIDs = rs.allowedOrderIDs.split(",");
                            if (!allowedIDs.includes(requestedID)) {
                                response.writeHead(302,
                                    { Location: '/Order?Security_Violation' }
                                );
                                response.end();
                                proxyRequest.abort();
                            }
                        } else {
                            response.writeHead(302,
                                { Location: '/Order?Security_Violation' }
                            );
                            response.end();
                            proxyRequest.abort();
                        }
                    }

                    if ((path.startsWith("/account/logout"))) {
                        rs.allowedOrderIDs = "";
                        // Note: Can't unset the key, as that leaves the existing value in redis:
                        //delete rs['allowedOrderIDs'];
                    }

                    client.hmset(request.VisitorId + "_ordercontrol", rs, function (err, replies) {
                        client.quit();    
                    });
                });
            };
        }
    }
}

exports.onResponse = function (options) {

    return function ordercontrolOnResponse(proxyResponse, request, response, options) {

        if (response.ordercontrol_active_uri === 1) {

            var allowedOrderIDs = [];
            var responseSelects = [];
            
            /*
                Order urls are within a TD:
                <td>
                    <a href="/Order/Details?id=6">Details</a>
                </td>
            */
            var orderanchor = {};
            orderanchor.query = 'td a'
            orderanchor.func = function (node) {

                // Parse each href and pull out the orderID
                var url = node.getAttribute('href');

                var re = new RegExp("id=(\\d+)");
                var match = re.exec(url);

                if (match) {
                    // Add all allowed OrderID's into an array
                    allowedOrderIDs.push(match[1]);
                }
                
            }
            responseSelects.push(orderanchor);

            var harmonfilter = harmon([], responseSelects);
            harmonfilter(null, response, function () { });

            response.on('finish', function (data) {
                // When the filter has finished, update Redis
                addAllowedOrderIDs(request.VisitorId, allowedOrderIDs);
            });
        }
    }
}

var addAllowedOrderIDs = function(visitorID, allowedOrderIDs) {

    var client = redis.createClient(6379, 'redis');
    client.on('connect', function () {

        // Check if our RS object is in Redis for this visitor
        client.hgetall(visitorID + "_ordercontrol", function (err, reply) {

            // rs is an object with stored, step_1,2,3,4 and completed fields
            var rs = { stored: 1 };

            if (reply) {
                rs = reply;
            }

            // Add a comma-separated list into redis of the allowed OrderIDs
            rs.allowedOrderIDs = allowedOrderIDs.join(",");

            client.hmset(visitorID + "_ordercontrol", rs, function (err, replies) {
                client.quit();    
            });
        });
    });
}