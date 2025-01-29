///////////////////////////////////////////////////////////////////
////////////////Show different pages

// Show start page function
const showStartPage = () => {
    window.location.href = 'index.html';
};

// Show recording page function
const showRecordingPage = () => {
  window.location.href = 'recording.html';
};


///////////////////////////////////////////////////////////////////
/////////Student recording page functions

// define modal elements
const uploadConfirmationModal = new bootstrap.Modal(document.getElementById('uploadConfirmationModal'));
const confirmUploadButton = document.getElementById("confirmUpload");

// define buttons from html
const recordButton = document.getElementById('recordButton');
const replayButton = document.getElementById('replayButton');
const deleteButton = document.getElementById('deleteButton');
const uploadButton = document.getElementById('uploadVideoButton');

// create global variables for recording functions
let mediaRecorder; //create global mediaRecorder to be referenced in all recording page functions
let recordedChunks = []; //create global recorded chunks to be referenced in all recording page functions
let isRecording = false; //create global variable isRecording to false everytime the page runs, to be used in toggleRecording function

// start camera when page opens
window.addEventListener('load', function() {
  startCamera();
});

//start camera
function startCamera() {
  localStorage.removeItem('videoBlob'); // Clear any existing video in localStorage
  const video = document.getElementById('video');
  navigator.mediaDevices.getUserMedia({ video: true, audio: true })
.then(stream => {
  video.srcObject = stream;
  video.muted = true;  // This will mute the audio from the video element (prevents echoing)
  const options = { mimeType: 'video/webm;codecs=vp8,opus' }; // try different mime types
  mediaRecorder = new MediaRecorder(stream, options);

  mediaRecorder.ondataavailable = event => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };
})
.catch(err => {
  console.error('Error accessing camera:', err);
});
}

// Toggle function to show/hide replay, delete, and upload buttons
function toggleButtons(show) {
    const buttons = [replayButton, deleteButton, uploadButton];
    buttons.forEach(button => {
        button.classList.toggle('hidden', !show);
    });
}

//record button functionality
document.getElementById('recordButton').addEventListener('click', toggleRecording);

//replay button functionality
document.getElementById('replayButton').addEventListener('click', replayRecording);

//delete button functionality
document.getElementById('deleteButton').addEventListener('click', deleteRecording);

//upload video button functionality
document.getElementById('uploadVideoButton').addEventListener('click', () => {
    uploadConfirmationModal.show(); //prompt user to confirm video upload
});

//confirm upload button functionality
confirmUploadButton.addEventListener("click", () => {
  uploadVideo();
});

// start recording
function startRecording() {
    recordedChunks = [];
    mediaRecorder.start();
    console.log('Recording started');
  }

//stop recording
function stopRecording() {
    mediaRecorder.stop();
    mediaRecorder.onstop = () => {
    console.log('Recording stopped');

    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    
    // Save the video blob to IndexedDB
    saveVideoBlobToDB(blob).then(() => {
      console.log('Video saved to IndexedDB');
    }).catch(err => {
      console.error('Error saving video to IndexedDB:', err);
    });
    }; 
    
  }

//create video URL to use in saveVideo function (called when upload video button is clicked and confirmed)
function uploadVideo() {
    const studentName = localStorage.getItem('studentName');
    const facilitatorName = localStorage.getItem('facilitatorName');
    const date = localStorage.getItem('date');
    const procedureDescription = localStorage.getItem('procedureDescription');
  
    // Check if there are recorded chunks
    if (recordedChunks.length === 0) {
      alert('Please record a video first by pressing "Start Recording".');
      return;  // Prevent upload
    }

    getVideoBlobFromDB().then(videoBlobs => {
      if (videoBlobs.length > 0) {
        const videoBlob = videoBlobs[videoBlobs.length - 1]; // Get the most recent video Blob
        const videoUrl = URL.createObjectURL(videoBlob);  // Create a URL for the Blob
        saveVideo(studentName, facilitatorName, date,  procedureDescription, videoUrl);  // Use URL for the video
        alert('Video saved successfully!');
        showStartPage(); //bring back to start page

        // Delete video from IndexedDB after saving
        deleteAllVideosFromDB().then(() => {
          console.log('Video deleted from IndexedDB');
        }).catch(err => {
          console.error('Error deleting video from IndexedDB:', err);
        });

        localStorage.clear(); // Delete all info + videos from local storage after saving

      } else {
        alert('No video to upload. Please record a video first.');
      }
    }).catch(err => {
      console.error('Error retrieving video from IndexedDB:', err);
    });
}
  
//save video to computer using video URL from uploadVideo() function (define destination folder in browser settings)
function saveVideo(studentName, facilitatorName, date,  procedureDescription, videoUrl) {
    const downloadLink = document.createElement('a');     // Create a link element
    downloadLink.href = videoUrl; // Set the href to the Blob URL
    downloadLink.download = `${studentName} (Dr ${facilitatorName}, ${date}, ${procedureDescription})`;  // Set the download attribute to specify the filename
    downloadLink.click(); // Programmatically trigger a click event on the link to start the download
    URL.revokeObjectURL(videoUrl); // Optionally, revoke the Blob URL if you're done with it
  }

//toggle between "start recording" and "stop recording" button
function toggleRecording() {
  const recordButton = document.getElementById('recordButton');
  if (isRecording) {
      // Stop recording
      stopRecording();
      recordButton.textContent = 'Start Recording';
      recordButton.classList.remove('btn-danger');  // Remove red color
      recordButton.classList.add('btn-success');  // Add original color
      toggleButtons(true); // Show other buttons when a recording is available
  } else {
      // Start recording
      startRecording();
      recordButton.textContent = 'Stop Recording';
      recordButton.classList.remove('btn-success');  // Remove original color
      recordButton.classList.add('btn-danger');  // Add red color
      toggleButtons(false); // Hide other buttons while recording
  }
  isRecording = !isRecording;  // Toggle the recording state
}

// Function to replay the video after recording
function replayRecording() {
  getVideoBlobFromDB().then(videoBlobs => {
    if (videoBlobs.length > 0) {
      const videoBlob = videoBlobs[videoBlobs.length - 1]; // Get the most recent video Blob
      const videoUrl = URL.createObjectURL(videoBlob);  // Create a URL for the Blob
      const videoElement = document.getElementById('replayVideo');
      videoElement.src = videoUrl;  // Set the video source to the fetched Blob URL
      videoElement.style.display = 'block';
      videoElement.play();  // Play the video
      console.log("Replaying video...");
    } else {
      alert("No recording available to replay!");
    }
  }).catch(err => {
    console.error('Error retrieving video from IndexedDB:', err);
  });
}

// Function to delete the current recording and reset the state
function deleteRecording() {
  recordedChunks = []; // Clear recorded chunks
  const video = document.getElementById('video');
  video.src = ''; // Clear the video source
  const videoElement = document.getElementById('replayVideo');
  videoElement.style.display = 'none'; //hide the replay screen
  deleteAllVideosFromDB().then(() => {
    console.log('Video deleted from IndexedDB');
  }).catch(err => {
    console.error('Error deleting video from IndexedDB:', err);
  });
  alert('Recording deleted and reset.');
}


///////////////////////////////////////////////////////////////////
/////////IndexedDB functions (for saving studentt recordings temporarily in larger storage capacity than localStorage)

// Open IndexedDB database
function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('videoDB', 1);
  
      request.onupgradeneeded = event => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('videos')) {
          db.createObjectStore('videos', { autoIncrement: true });
        }
      };
  
      request.onerror = event => {
        reject('Error opening IndexedDB');
      };
  
      request.onsuccess = event => {
        resolve(event.target.result);
      };
    });
  }
  
// Save video blob to IndexedDB
function saveVideoBlobToDB(blob) {
  return openDB().then(db => {
    const transaction = db.transaction('videos', 'readwrite');
    const store = transaction.objectStore('videos');
    
    // Create a File object with the proper name and type
    const videoFile = new File([blob], 'video_recording.webm', { type: 'video/webm' });  // You can change the file extension and MIME type
    store.add(videoFile);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject('Error saving video to DB');
    });
  });
}
  
// Retrieve video blob from IndexedDB
function getVideoBlobFromDB() {
  return openDB().then(db => {
    const transaction = db.transaction('videos', 'readonly');
    const store = transaction.objectStore('videos');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject('Error retrieving video from DB');
    });
  });
}

// delete videos stored in IndexedDB
function deleteAllVideosFromDB() {
  return openDB().then(db => {
    const transaction = db.transaction('videos', 'readwrite');
    const store = transaction.objectStore('videos');
    
    // Clear all records in the object store
    const deleteRequest = store.clear();

    return new Promise((resolve, reject) => {
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject('Error deleting all videos from DB');
    });
  });
}