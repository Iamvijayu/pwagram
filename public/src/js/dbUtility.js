// this open method is callback and not promise!!!!!
// posts-store is the database name, next parameter is the version
var dbPromise = idb.open('posts-db', 1, function (db) {
    if (!db.objectStoreNames.contains('posts')) {
        // this function is executed, when the indexDB is created
        // creating table like structure called 'posts'
        // defining the primary key to this objectstore, ID
        // if we store any object with id property in this objectstore,
        // it will be easy to search later.
        db.createObjectStore('posts', {
            keyPath: 'id'
        });
    }
    // setting up new objectstore for storing sync tasks 
    if(!db.objectStoreNames.contains('sync-posts')) {
        db.createObjectStore('sync-posts', { keyPath: 'id'});
    }
});


function writeDatatoIndexDB(stor,data) {
    return dbPromise.then(db => {
        // everything should be inside a transaction
        // posts is the object store that we are targetting
        // it can be either read or readwrite
        // we are writing , so readwrite
        var txn = db.transaction(stor, 'readwrite');
        // again we need to take the store out DUNNO WHY?
        var store = txn.objectStore(stor);
        // `Putting ${data} in INdexed DB`
        store.put(data);
        // now return transaction.complete to inform the transaction is complete
        // complete is a property and not a method
        return txn.complete;
    });
}

function readAllData(stor) {
    return dbPromise
    .then(db => {
      var tx = db.transaction(stor,'readonly');
      var store =tx.objectStore(stor);
      // here we dont have to close/complete the transaction
      // because, its a read operation and we dont care if it fails
      // it will not impact the database integrity
      // BUT ALL operations should be instide db.transaction...
      return store.getAll();
    });
}

function clearAllData(store) {
    return dbPromise
      .then(db => {
           var txn = db.transaction(store, "readwrite");
           var stor = txn.objectStore(store);
           //clearing Index DB 
           stor.clear();
           return txn.complete;
      })
}

function deleteDataFromIndexedDB(store, dataItemID) {
    dbPromise.then( db => {
        var txn = db.transaction(store,"readwrite");
        var stor = txn.objectStore(store);
        stor.delete(dataItemID);
        return txn.complete
         .then ( () => {
             console.log("Item deleted from IndexedDB");
         } );
    })
}

function urlBase64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);

    for (var i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}


// Canvas Element. toDataURL() will give the stream as URL
// similar to fileRead.toDataURL
function dataURItoBlob (dataURI) {
    var byteString = atob(dataURI.split(',')[1]);
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
    var ab = new ArrayBuffer(byteString.length);
    var ia  = new Uint8Array(ab);
    for( var i=0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    var blob = new Blob([ab], {type: mimeString});
    return blob;
}