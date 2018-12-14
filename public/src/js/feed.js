var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');
var form = document.querySelector('form');
var locationInput = document.querySelector('#location');
var titleInput = document.querySelector('#title');
var videoPLayer = document.querySelector('#player');
var canvasElement = document.querySelector('#canvas');
var captureButton = document.querySelector('#capture-btn');
var imagePicker = document.querySelector('#image-picker');
var imagePickerArea = document.querySelector('#pick-image');
var picture;
var fetchedLocation;
var locationBtn = document.querySelector('#location-btn');
var locationLoader = document.querySelector('#location-loader');


locationBtn.addEventListener('click', event => {
  event.preventDefault();
  // just a defensive way to return, if geolocation api is not supported by browser
  if(!('geolocation' in navigator)) {
    return;
  }
//  locationBtn.style.display = 'none';
  locationLoader.style.display = 'block';
  navigator.geolocation.getCurrentPosition(
    positionCB => {
      let lat = positionCB.coords.latitude;
      let lon = positionCB.coords.longitude;
      console.log(lat,lon);
      var locURL = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1`;
      fetch(locURL)
      .then( loca => loca.json())
      .then(loc => {
            let address = (loc.address.town + ',' + loc.address.county + ',' + loc.address.state);
            fetchedLocation = address;
            locationInput.value = fetchedLocation;
            locationInput.classList.add('is-focused');
            locationBtn.style.display = 'none';
            locationLoader.style.display = 'none';
         })
        .catch(error => {
          fetchedLocation=`LAT: ${lat} LON: ${lon}`;
          locationInput.value = fetchedLocation;
          locationInput.classList.add('is-focused');
          locationBtn.style.display = 'none';
          locationLoader.style.display = 'none';
        })
    },
    errorCB => {
      locationBtn.style.display = 'inline';
      locationLoader.style.display = 'none';
      alert('Could\'t fetch location, please enter manually');
      var data = {message: 'Could\'t fetch location, please enter manually'};
      snackBar.MaterialSnackbar.showSnackbar(data);
      fetchedLocation = null;
    }, 
    {timeout: 7000});
})

//.json is added as needed by firebase
//var url = 'https://pwagram-423a7.firebaseio.com/posts.json';
//var url = 'https://us-central1-pwagram-423a7.cloudfunctions.net/storePostData'; 
var url = 'http://localhost:3000/';
var urlPost = 'https://httpbin.org/post';
var networkDataReceived = false;

function initializeLocation() {
  if(!('geolocation' in navigator)) {
    locationBtn.style.display = 'none';
    locationLoader.style.display = 'none';
  }
}


function initializeMedia() {
  // **********************VERY IMPORTANT***********************************
  // intention : to create a comman way in our APP to access the userMedia for new and old browsers
  // ***********************************************************************
  // Check if the media devices API are available / supported by the browser
  // If not supported, created a dummy object, on which we will 
  // link the older APIs for connecting the media devices
  if(!('mediaDevices' in navigator)) {
    navigator.mediaDevices ={}
  }
  // getUserMedia wont be there if its a old browser ( we have created a dummy object above)
  // for the latest browsers that support MediaDevices API, getUserMedia will be available
  // this is a kind of our own polyfill
  if(!('getUserMedia' in navigator.mediaDevices)) {
    // Add a function to support our own implementation ( connecting old way of accessinig camera ) of the getUserMedia
    // remember we created dummy mediaDevices above 
    // constraints: video or audio or ...
    navigator.mediaDevices.getUserMedia = function(constraints) {
      // create a new variable and hold webkit(safari) or mozilla UserMedia (old browser way of acceing media)
      // intention : to create a comman way in our APP to access the userMedia for new and old browsers
      var gerUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;    

      if(!getUserMedia) {
        // Very old browser; may be internetExplorer
        // Latest browser's getUserMedia returns promise, so we also return a Promise (with a reject)
        return Promise.reject(new Error('getUserMedia is not implemented!!!'));
      }
      // now we have UserMedia to support old browser, so return it
      return new Promise((resolve,reject) => {
        //return a promise that will call the that we created above and pass the constraints
        // javascript call(bind) old school
        getUserMedia.call(navigator, constraints, resolve, reject)
      });
    }
  }
  // pass getUserMedia the video constraint to get access to video only
  // if we need audio also we need to add audio:true
  // AUTOMATICALLY DEVICE WILL ASK FOR PERMISSION FROM USER TO ACCESS THE CORRESPONDING MEDIA
  navigator.mediaDevices.getUserMedia({video:true})
  .then( stream => {
    videoPLayer.srcObject = stream;
    videoPLayer.style.display = 'block'; // reset again to 'none' once the create post modal is closed/transformed
    captureButton.style.display = 'block';
  })
  .catch(err => {
    // error could be due to 
    // 1. User did not give permission to access Video
    // 2. GetuserMedia was not implemented ( no latest browser or our own polyfill applied)
    // 3. anything else
    // in this case, go to old school approach... file picker
    imagePickerArea.style.display = 'block'; // reset again to 'none' once the create post modal is closed/transformed

  })
}

captureButton.addEventListener('click', event => {
  canvasElement.style.display = 'block';
  videoPLayer.style.display = 'none';
  captureButton.style.display = 'none';
   // get the context, initialize to draw 2d image on the canvas
   var context = canvasElement.getContext('2d');
   // videoHeight calculation part to calculate aspect ratio, which I dont understand yet
   // 1st parameter: source can be CSSImageValue, HTMLImageElement, HTMLVideoElement, HTMLCanvasElement, ImageBitmap
   // for more visit: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
   context.drawImage(videoPLayer, 0, 0, canvas.width, videoPLayer.videoHeight / (videoPLayer.videoWidth / canvas.width))
   // Get all tracks of the videoPlayer and stop them all.
   // currently we have only one though
   videoPLayer.srcObject.getVideoTracks().forEach( track => {
     track.stop();
   })
  // simlar to fileReader
  picture = dataURItoBlob(canvasElement.toDataURL());
});

imagePicker.addEventListener('change', event => {
  picture = event.target.files[0];
});

function openCreatePostModal() {
  setTimeout(() => {
    createPostArea.style.transform = 'translateY(0)';  
  }, 1);
  initializeMedia();
  initializeLocation();
  if (defereedPromptEvent) {
    defereedPromptEvent.prompt();

    defereedPromptEvent.userChoice.then(function(choiceResult) {
      console.log(choiceResult.outcome);

      if (choiceResult.outcome === 'dismissed') {
        console.log('User cancelled installation');
      } else {
        console.log('User added to home screen');
      }
    });

    defereedPromptEvent = null;
  }
}

function closeCreatePostModal() {
  //createPostArea.style.display = 'none';
  //createPostArea.style.transform = 'translateY(100vh)';
  imagePickerArea.style.display = 'none'; // resetting to original value
  videoPLayer.style.display = 'none'; // resetting to original value
  canvasElement.style.display = ' none'; // resetting to original value
  if(videoPLayer.srcObject) {
     videoPLayer.srcObject.getVideoTracks().forEach( track => {
     track.stop();
   })
  }
  setTimeout(() => {
    createPostArea.style.transform = 'translateY(100vh)';
  }, 1);
}


shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

form.addEventListener('submit', (event) => {
   event.preventDefault(); // to prevent the default behaviour
   
   if (titleInput.value.trim() === '' || locationInput.value.trim()==='' || picture == null) {
    alert('please enter a valid data (title & location) and capture the image properly');
    var data = {message: 'please enter a valid data (title & location) and capture the image properly'};
    snackBar.MaterialSnackbar.showSnackbar(data);
    return;
   }
   
   closeCreatePostModal();

    // tag name sync-new-post
    var post = {
      id: new Date().toISOString(),
      title: titleInput.value,
      location: locationInput.value,
      image: picture
      //image: 'https://firebasestorage.googleapis.com/v0/b/pwagram-423a7.appspot.com/o/sf-boat.jpg?alt=media&token=dfdf3da6-aa7b-4c44-b2f1-6552b7fe5558'
    };

   // Check if browser supports SW and SyncManager (SyncManager provides API for background sync)
   // small S and capital W and Captial S and Capital M
   if('serviceWorker' in navigator && 'SyncManager' in window)  {
    // when  SW is ready, register sync of the SW with a tag name
    navigator.serviceWorker.ready
    .then( sw => { // SW is service worker registration..
         writeDatatoIndexDB('sync-posts', post)
         .then( () => {
            // register the sync only if we were able to write data to IndexedDB
            return sw.sync.register('sync-new-post');
         })
         .then( () => { // chain another then, sw.sync.register will return promise<void>
            var snackBar = document.querySelector('#confirmation-toast');
            // format of data to be shopwn in snackbar
            var data = {message: 'You message was saved for syncing'};
            titleInput.value="";
            locationInput.value="";
            snackBar.MaterialSnackbar.showSnackbar(data);
         })
         .catch( error => {
           console.log("Sync Error: " , error);
         })
         
    })
   } else {
     sendData(post);
   }
}); 


function sendData(post) {
  var postData = new FormData();
  postData.append('id', post.id);
  postData.append('title', post.title);
  postData.append('location', post.location);
  // Actually we are hardcoding to .png, but we can identify the header of the file using fileReader
  postData.append('image', post.image, post.id + '.png');
  fetch('http://pwagramserver-env.sinphsihnw.us-east-2.elasticbeanstalk.com/posts', {
    method: 'POST',

    // headers: {
    //   'Content-type': 'application/json',
    //   'accept': 'application/json'
    // },
    // body: post
    body: postData
  })
  .then(res => {
    console.log("Send Data Response", res);
    createCard(post);
  })
}

// Currently not in use, allows to save assets in cache on demand otherwise
function onSaveButtonClicked(event) {
  console.log('clicked');
  if ('caches' in window) {
    caches.open('user-requested')
      .then(function(cache) {
        cache.add('https://httpbin.org/get');
        cache.add('/src/images/sf-boat.jpg');
      });
  }
}

function clearCards() {
  while(sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}

function createCard(data) {
  var cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  var cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = 'url(' + data.image + ')';
  cardTitle.style.backgroundSize = 'cover';
  cardTitle.style.height = '180px';
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.style.color = 'white';
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = data.location;
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = data.title;
  cardSupportingText.style.textAlign = 'center';
  // var cardSaveButton = document.createElement('button');
  // cardSaveButton.textContent = 'Save';
  // cardSaveButton.addEventListener('click', onSaveButtonClicked);
  // cardSupportingText.appendChild(cardSaveButton);
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

function createCards(dataArray) {
  clearCards();
  dataArray.forEach(data => {
    createCard(data);
  });
}


// DONT ADD POST REQUEST in a CACHE, let us see how it behaves
// fetch(urlPost, {
//   method: "POST",
//   headers: {
//      "Content-Type" : "application/json",
//      "accept" : "application/json"
//   },
//   body : JSON.stringify({message: "Hey You send me the same text back"})
// })
// .then( res => {
//       return res.json();
//  })
//  .then(data => {
//    console.log(data);
//  });

//fetch('https://pwagram-423a7.firebaseio.com/posts.json')
fetch('http://pwagramserver-env.sinphsihnw.us-east-2.elasticbeanstalk.com/posts')
  .then(function(res) {
    return res.json();
  })
  .then(function(datum) {
    networkDataReceived = true;
    dataArray =[];
    let data = datum.posts;
    for(var key in data)  {
      dataArray.push(data[key]);
    }
    createCards(dataArray);
  })
  .catch(error => {

  });

if ('indexedDB' in window) {
  // readALlData in utility.js will return store.getAllData()
  // which is a promise resolve to data array
  readAllData('posts')
  .then(data => {
     if (!networkDataReceived) {
       createCards(data);
     }
  })
}
