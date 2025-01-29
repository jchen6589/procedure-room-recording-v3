///////////////////////////////////////////////////////////////////
//////////Create variables from  html

//create variables from start page
const studentNameInput = document.getElementById('studentName');
const facilitatorNameInput = document.getElementById('facilitatorName');
const dateInput = document.getElementById('date');
const procedureDescriptionInput = document.getElementById('procedureDescription');
const proceedToRecordingButton = document.getElementById('proceedToRecordingButton');

//create variables from modal
const confirmInfoModal = new bootstrap.Modal(document.getElementById('confirmInfoModal'));
const confirmSubmitButton = document.getElementById("confirmSubmitButton");


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
/////////Start page functions

// Initialize the datepicker
$(document).ready(function() {
  $('#date').datepicker({
  format: 'mm/dd/yyyy', // Date format
  autoclose: true, // Close the picker after date selection
  todayHighlight: true // Highlight today's date
  });   
});

//Proceed to recording button functionality
proceedToRecordingButton.addEventListener('click', () => {
  const form = document.getElementById('procedureForm');
  if (form.checkValidity()) { //check if all input fields are filled
    const studentName = studentNameInput.value.trim();
    const facilitatorName = facilitatorNameInput.value.trim();
    const date = dateInput.value.trim();
    const procedureDescription = procedureDescriptionInput.value.trim();
    
    localStorage.setItem('studentName', studentName);
    localStorage.setItem('facilitatorName', facilitatorName);
    localStorage.setItem('date', date);
    localStorage.setItem('procedureDescription', procedureDescription);
    
    // Fill modal content with form data
    document.getElementById('confirmStudentName').textContent = studentName;
    document.getElementById('confirmFacilitatorName').textContent = facilitatorName;
    document.getElementById('confirmDate').textContent = date;
    document.getElementById('confirmProcedureDescription').textContent = procedureDescription;

    // Show the modal
    confirmInfoModal.show();

  } else {
    // If form is not valid (not all fields are filled), it will show validation errors
    form.reportValidity(); // This will show the validation messages
  }
});

///Final submit button functionality
  confirmSubmitButton.addEventListener('click', () => {
    showRecordingPage();
  });