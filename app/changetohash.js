import bcrypt from 'bcryptjs';
//import * as nodeUrl from "url";
//import express from 'express';
//import bodyParser from 'body-parser';
import split from 'split-string';

const saltRounds = 10;


export function onRequest (options) {
    return function hashOnRequest(proxyRequest, request, response, options) {
        if (((proxyRequest.path == "/signup") || (proxyRequest.path == "/login")) && (request.method == 'POST')) {
            // Make any needed POST parameter changes
            let body = '';
            request.on('data', (chunk) => {
                body += chunk;
            }).on('end',  () => {
                // at this point, `body` has the entire request body stored in it as a string
                if (body != ''){
                    var arr = split(body, { separator: '&' });
                    var copy = [];
                    for (var i=0; i < arr.length; i++){
                        copy[i] = split(arr[i], { separator: '=' });
                    }
                    var bodyRequest = new Object();
                    bodyRequest.userName = copy[0][1];
                    bodyRequest.password = copy[1][1];
                    bodyRequest._csrf = copy[2][1];
                
                    // URI encode JSON object
                    bodyRequest = Object.keys( bodyRequest ).map(function( key ) {
                        return encodeURIComponent( key ) + '=' + encodeURIComponent( bodyRequest[ key ])
                    }).join('&');
    
                    // Update header
                    //request.setHeader( 'content-type', 'application/x-www-form-urlencoded' );
                    //request.setHeader( 'content-length', bodyRequest.length );
    
                    // Write out body changes to the proxyReq stream
                    //proxyRequest.write( bodyRequest );
                    //proxyRequest.end();
                }
            });
            
        }
    }    
        
}
