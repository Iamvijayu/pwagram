var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');


function floatingButtonClick() {
  openCreatePostModal();
  if (defereedPromptEvent) {
    showAddToHomeBannerPrompt();
  }
}

function showAddToHomeBannerPrompt() {
  // Show the add to home banner prompt, event was stored in app.js(beforeinstallprompt event)
  defereedPromptEvent.prompt();  
  // we can capture choice user made on the prompt
  // its a promise, so supply a function
  defereedPromptEvent.userChoice.then( (choiceResult) => {
      console.log(choiceResult.outcome);  // choiceResult is a string returned
    if (choiceResult.outcome === 'dismissed') {
      console.log('user cancelled installation');
    } else {
      console.log('user added to home screen');
    }
    //We need to clear this, beacuse only once it will be prompted
    // To test, go to device, in Chrome, choose i, site settings-> clear & Reset
    // this is to clear all site data and chrome can prompt us again.
    defereedPromptEvent = null; 
  })
  
}

function openCreatePostModal() {
  createPostArea.style.display = 'block';
}

function closeCreatePostModal() {
  createPostArea.style.display = 'none';
}

shareImageButton.addEventListener('click', floatingButtonClick);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);
