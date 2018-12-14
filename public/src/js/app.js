// Register Service worker here
// bcoz app.js is added as <script> tag of all the html files 
// (index.html in public and help)

var defereedPromptEvent; // to store the event in beforeinstallprompt event
var serviceWorkerRegistration;
var enableNotificationButtons = document.querySelectorAll('.enable-notifications');

// PWA is about progressively enhancing the app, so first check 
// if serviceWorker is supported by browser(Navigator)
if('serviceWorker' in navigator) {
   
    navigator.serviceWorker
    // register sw.js from root folder
    // when we register, sw.js, we try to fetch that,
    // service worker itself is not cached
    // we should not cache SW bcoz, it will not load latest SW version
    // and it will be cache(SW)=> SW will cache (app.js) in install event===> app.js will again cache SW.
    // infinite loop
    // .register('/sw.js')
   .register('/service-worker.js') 
   .then( serviceWorkerRegistration1 => {
     serviceWorkerRegistration = serviceWorkerRegistration1;
      console.log('Service Worker Registered');
   });
    // register will tell browser that treat this .js file differently ( not like regular js file)
}

/********************************** 
Unregistration is possible thru following code
navigator.serviceWorker.getRegistrations().then(function(registrations) {
 for(let registration of registrations) {
  registration.unregister()
} })
//********************************* */

// BY default, chrome will show the banner to add our PWA app to home screen
// ONLY if all criteria like (SW registred, served on https, manifest available, 
// visited twice with a gap of atleast 5 min etc.. )
// HOWEVER we have the option to defer the banner showing this msg.
// say we may want chrome to show the banner, when we want ( on visiting partcular secion of app may be)
// listen to 'beforeinstallprompt' on WINDOW object
window.addEventListener('beforeinstallprompt',(event) => {
  console.log('before install prompt fired and prevented');
  event.preventDefault();
  defereedPromptEvent = event; // event is stored, so that it can be fired later
  // this event can be fired from any of the JS connect with DOM, 
  // say on a click of + button
  // in this example, please go to feed.js 
  return false;
});

function askPermissionforNotification(event) {
  // If User grants access to display notification, he implicitly grants accces to push notifications  
  // please keep in mind, that display notification can be done seperately
  // no code required in sw for handling 'push' event for displaying notification
  Notification.requestPermission()
              .then(userAction => {
                console.log("User action for notification permission: ", userAction);
                if(userAction !== 'granted') {
                  console.log('no notification permission granted');
                } else {
                  // we will cathis later
                  // displayNotifications();
                  checkforSubscriptions();
                }
              })
}

function checkforSubscriptions() {
  // Check for any subscription from the push manager of the serviceworker which belongs to a browser on a device
  // Device=>browser=>serviceworker=>pushManager=>getsubscriptions
  // AndroidPhone=>chrome=>sw=>pushManager=>get_subscriptions
  // SameAndroidPhone=>firefox=>sw=>pushManager=>get_subscriptions
  var regn;
  if( navigator.serviceWorker) {
    navigator.serviceWorker.ready
    .then( swregn => {
       regn = swregn;
       return swregn.pushManager.getSubscription()
    })
    .then(pushSubscription => {
       if(pushSubscription == null) {
         // Create new one and we dont have any subscription
         //var vapidPublickey = 'BL5EnQDa4BJkHmuYE1MQNwBINj_KyUTIxlWvrerq8CHFcXLegnbwXjT2aG9tgYwa_A6GNeNE-T8M2QhKseAtHa8';
         var vapidPublickey = 'BIwZAJBoTgOOCs5gn4dS3zVKJFqKuCkWHK1yFotHUzEBqwAiT6E3EJlPl4ZndJwX7ns6HAsYMUJsDliMvSk8ETg';
         var convertedVapidKey = urlBase64ToUint8Array(vapidPublickey);
         return regn.pushManager.subscribe({
           userVisibleOnly:true,
           applicationServerKey: convertedVapidKey
         });
       } else { 
         return regn.pushManager.getSubscription();
         console.log('subscription already available');
       }
    })
    .then(subscription => {
        // in case of post sync, we just added a method in backend(functions folder) index.js
        // for handling HTTP POST request
        // exports.storePostData = functions.https.onRequest((request, response) => {
        // But we can direclty post to a database like this
        // 'https://pwagram-423a7.firebaseio.com/subscriptions.json'
        //return fetch('https://pwagram-423a7.firebaseio.com/subscriptions.json', {
          if(subscription) {
            return fetch('http://pwagramserver-env.sinphsihnw.us-east-2.elasticbeanstalk.com/subscriptions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'accept': 'application/json'
            },
            body: JSON.stringify(subscription)
        })
      }
    })
    .then(response => {
      if(response.ok) {
        displayNotifications();
      }
    })
    .catch( error => {
      console.log("Error in pushing the subscription server url/key to server", error);
    });


  }
}

function displayNotifications() {
  var options= {
    body: 'You have subscribed successfully',
    icon: '/src/images/icons/app-icon-96x96.png', // icon to be displayed on notification tray
    image: '/src/images/sf-boat.jpg', // image to be displayed on notification bar(expanded)
    dir: 'ltr', // direction left to right
    lang: 'en-US', // BCP 47
    vibrate: [100,50,200], // vibrate for 100ms, pause 50ms, then vibrate 200ms
    badge: '/src/images/icons/app-icon-96x96.png', // black & white image shown in android?
    tag: 'confirm-notification', // this tells name/type of notification. 
    //Same type of notification( same tag) will stack to gather rather than individual notifications 
    renotify: true,
     // true means, for same type of notification, do vibrate and alert; if false, ignore and do not alert ( vibrate only for 1st notification).
     // there can be more than 1 actions, to be given in array of objects
     // some devices may not show actions, some may show limited actions
     // confirm , cancel are the action IDS. Clicking on the same will generate
     // 'notificationclick' event in service worker.
     actions: [ 
       {action: 'confirm', title: 'ok', icon: '/src/images/icons/app-icon-96x96.png'},
       {action: 'cancel', title: 'cancel', icon: '/src/images/icons/app-icon-96x96.png'}
     ]

  };
   navigator.serviceWorker.ready
     .then(swRegn => { 
          swRegn.showNotification("Success SW", options);
        //new Notification("Success", options);
     })
}


// Check if the notification is supported by the browser
if('Notification' in window) {
  enableNotificationButtons.forEach( button => {
    button.style.display = 'inline-block';
    button.addEventListener('click', askPermissionforNotification);
  })
}




// var DeleteSWimagebutton = document.querySelector('#DeleteSW-image-button');
// DeleteSWimagebutton.addEventListener('click', () => {
//    console.log("Deleted");
//    if(serviceWorkerRegistration) {
//      serviceWorkerRegistration.unregister();
//    }
// })