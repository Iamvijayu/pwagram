importScripts("https://storage.googleapis.com/workbox-cdn/releases/3.6.3/workbox-sw.js");
importScripts('/src/js/idb.js');
importScripts('/src/js/dbUtility.js');

workbox.setConfig({
    debug: false
});
workbox.precaching.suppressWarnings();
//workbox.precaching.precacheAndRoute(self.__precacheManifest, {});

// look into https://developers.google.com/web/tools/workbox/modules/workbox-routing
//lets register a route to precache dynamically loaded material icons, fonts etc..
// we are using regEx: to cache request going to googleapis(fonts) and gstatic(icons)
// regex: find googleapis and gstatic in the URL we are sending the request to
// regex:Contd: and end with .com
// Workbox sw will have a fetch listener running in the background and it will fetch and cache for us, if the url has googleapis or gstatic
// Strategy: StaleWhileRevalidate means it will get content from cache and simulatenously fetch from network, if we have updated resources, it will present and cache the new updated response.
// Our own: Cache then Network strategy
workbox.routing.registerRoute(/.*(?:googleapis|gstatic)\.com.*$/, 
            workbox.strategies.staleWhileRevalidate(
                {
                    cacheName: 'google-fonts',
                    plugins: [
                        new workbox.expiration.Plugin({
                        maxAgeSeconds: 60 * 60 * 24 * 7
                                })
                            ]
                }
            ));
// storing .css style for material style
workbox.routing.registerRoute('https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
    workbox.strategies.staleWhileRevalidate({
        cacheName: 'material-css'
    }));

// We can write our own handlers
// this is similar to our handlers in our own SW, provide URL,
// event argument is  wrapperd inside args (like args.event)

    workbox.routing.registerRoute('http://pwagramserver-env.sinphsihnw.us-east-2.elasticbeanstalk.com/posts', args => {
        return fetch(args.event.request)
            .then(function (res) {
                var clonedResponse = res.clone();
                clearAllData('posts')
                    .then(() => {
                        // clonedresponse .json() returns a promise
                        return clonedResponse.json()
                    })
                    .then(datum => {
                        let data;
                        if (datum) data = datum.posts;
                        for (var key in data) {
                            writeDatatoIndexDB('posts', data[key]);
                        }
                    })
                return res;
            })

    })
// For offline.html fallback support
// if any html file is requested 
// if offline, look into dynamic cache (cache.match) and if not found return offline.html
workbox.routing.registerRoute(routeData => {
 // if the requested url has the header that accepts text/html   => for any html file request
 return (routeData.event.request.headers.get('accept').includes('text/html'));
}, args => {  // Huh CALLBACK HELL
    return caches.match(args.event.request) // try to get from cache, and return if we have the html
     .then(response => {
         if(response) {
           return response;
         } else {
             return fetch(args.event.request) // we dont have the request in cache, so try to fetch from network
              .then(resp => {
                  return caches.open('dynamic')
                     .then(cache => {
                         cache.put(args.event.request.url, resp.clone());
                         return resp;
                     })
              })
              .catch(error => { // If fetch fails(offline), look for offline.html iin cache and return it
                  return caches.match('/offline.html')
                   .then( res => {
                       return res;
                   })
              })
         }
     })


})

// preCache Images
workbox.routing.registerRoute(/.*(?:pwagramimages)*\.com\/.*$/,
    workbox.strategies.staleWhileRevalidate({
        cacheName: 'post-images',
        plugins: [
            new workbox.expiration.Plugin({
                maxAgeSeconds: 60 * 60 * 24 * 7
            })
        ]
    }));





workbox.precaching.precacheAndRoute([]);

/*************** */
// As there is not support for sync, push notifications, we are using our own code
/*************** */

self.addEventListener('sync', event => {
    // check for the tag for which the event fired
    // open the indexedDB, as per the tag
    // send/post the request using fetch
    // if successful, remove entry from IndexedDB
    if (event.tag === 'sync-new-post') { // for now, we have only one tage, if more tags, we can use switch case
        console.log('[Service Worker] Syncing new posts');
        readAllData('sync-posts') //helper:  read the data from IndexedDB where sync-new-post related data is stored
            .then(data => {
                // now send/post the data to the server
                // there may be more than one data so loop through the same
                //var url = 'https://us-central1-pwagram-423a7.cloudfunctions.net/storePostData';
                var url = 'http://pwagramserver-env.sinphsihnw.us-east-2.elasticbeanstalk.com/posts';

                for (post of data) {
                    // formdata is the built in javascript type / class / object?
                    var postData = new FormData();
                    postData.append('id', post.id);
                    postData.append('title', post.title);
                    postData.append('location', post.location);
                    // Actually we are hardcoding to .png, but we can identify the header of the file using fileReader
                    console.log(post.image);
                    postData.append('image', post.image, post.id + '.png');

                    // for (var key of postData.entries()) {
                    //   console.log(key[0] + ', ' + key[1]);
                    // }

                    //  fetch(url, {
                    //    method: 'POST',
                    //    headers: {
                    //      'Content-Type': 'application/json',
                    //      'Accept': 'application/json'
                    //    },
                    //    body: JSON.stringify(post)
                    //  })
                    fetch(url, {
                            method: 'POST',
                            body: postData
                        })
                        .then(response => {
                            if (response.ok) {
                                console.log("posted the data successfully!!");
                                response.json()
                                    .then(resdata => {
                                        // remove the data from the indexedDB
                                        deleteDataFromIndexedDB('sync-posts', resdata.id);
                                    })
                            } else {
                                console.log("response :", response.json().then(res => res));
                            }

                        })
                }
            })
            .catch(error => {
                console.log("Service worker Syncing - Error occured: ", error);
            })
    }
});

self.addEventListener('notificationclick', event => {
    var notification = event.notification;
    var action = event.action;

    if (action === 'confirm') { // 'confirm' is the action id, provided in option parameter of showNotification method
        console.log("User pressed OK-confirm in the notification");
        notification.close();
    } else {
        // User clicked on any other content in the notification
        event.waitUntil(
            clients.matchAll() // clients means the browser windows which can be access by SW.
            .then(clients => {
                // browserwindow can be in open state or closed state
                var client = clients.find(cli => {
                    return cli.visibilityState === 'visible';
                });


                if (client != undefined) {
                    // if there is open client window, just navigate to the url
                    client.navigate(notification.data.url);
                    client.focus(); // keep this window to focus
                } else {
                    // browser is not in open state
                    clients.openWindow(notification.data.url);
                }
                notification.close();
            })
        )
    }
});


self.addEventListener('notificationclose', event => {
    console.log("User neither pressed cancel nor confirm in the notification");
    // notification is not clicked, not performed any actions confirm or cancel
    // notification just closed
    // we can take such information and identify, why user is not intereseted in our notification
});


self.addEventListener('push', event => {
    console.log("Event Push notification received by SW!!!");
    var data = {
        title: "New Static Title",
        content: "New Static Content",
        url: '/help'
    };
    if (event.data) {
        data = JSON.parse(event.data.text());
    }
    var options = {
        body: data.content,
        icon: '/src/images/icons/app-icon-96x96.png',
        badge: '/src/images/icons/app-icon-96x96.png',
        data: {
            url: data.url
        }
    }
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    )

});
