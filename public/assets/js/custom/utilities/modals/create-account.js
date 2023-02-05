"use strict";

// Class definition
var KTCreateAccount = function () {
	// Elements
	var modal;	
	var modalEl;

	var stepper;
	var form;
	var formSubmitButton;
	var formContinueButton;

	// Variables
	var stepperObj;
	var validations = [];

	// Private Functions
	var initStepper = function () {
		// Initialize Stepper
		stepperObj = new KTStepper(stepper);

		// Stepper change event
		stepperObj.on('kt.stepper.changed', function (stepper) {
			 if (stepperObj.getCurrentStepIndex() === 5) {
				formSubmitButton.classList.add('d-none');
				formContinueButton.classList.add('d-none');
				formSubmitButton.classList.remove('d-none');
				formSubmitButton.classList.add('d-inline-block');
			} else {
				formSubmitButton.classList.remove('d-inline-block');
				formSubmitButton.classList.remove('d-none');
				formContinueButton.classList.remove('d-none');
			}
		});

		// Validation before going to next page
		stepperObj.on('kt.stepper.next', function (stepper) {
			console.log('stepper.next', stepper);

			return stepper.goLast()
			// Validate form before change stepper step
			var validator = validations[stepper.getCurrentStepIndex() - 1]; // get validator for currnt step

		if(stepper.getCurrentStepIndex() === 4 && document.getElementById("skipcard").checked){
	 // my personal addings from stilkinging 🤪, this adds skip
			stepper.goNext();
			KTUtil.scrollTop();
			document.getElementById("skipcard").checked = false
			formContinueButton.innerText = "Continue"

		}else if (validator) {
			validator.validate().then(function (status) {
				console.log('validated!');

				if (status == 'Valid') {
					stepper.goNext();

					KTUtil.scrollTop();
				} else {
					Swal.fire({
						text: "Sorry, looks like some inputs were not filled correctlty.",
						icon: "error",
						buttonsStyling: false,
						confirmButtonText: "Ok, got it!",
						customClass: {
							confirmButton: "btn btn-light"
						}
					}).then(function () {
						KTUtil.scrollTop();
					});
				}
			});
			} else {
				stepper.goNext();

				KTUtil.scrollTop();
			}
		});

		// Prev event
		stepperObj.on('kt.stepper.previous', function (stepper) {
			console.log('stepper.previous');

			stepper.goPrevious();
			KTUtil.scrollTop();
		});


	}

	var initValidation = function () {
		// Init form validation rules. For more info check the FormValidation plugin's official documentation:https://formvalidation.io/
		// Step 1
		validations.push(FormValidation.formValidation(
			form,
			{
				fields: {
					account_type: {
						validators: {
							notEmpty: {
								message: 'Account type is required'
							}
						}
					}
				},
				plugins: {
					trigger: new FormValidation.plugins.Trigger(),
					bootstrap: new FormValidation.plugins.Bootstrap5({
						rowSelector: '.fv-row',
                        eleInvalidClass: '',
                        eleValidClass: ''
					})
				}
			}
		));

		// Step 2
		validations.push(FormValidation.formValidation(
			form,
			{
				fields: {
					'occupation': {
						validators: {
							notEmpty: {
								message: 'Occupation is required'
							}
						}
					},
					'dob': {
						validators: {
							notEmpty: {
								message: 'Date of birth is required'
							}
						}
					},
					'country': {
						validators: {
							notEmpty: {
								message: 'Country is required'
							}
						}
					},
					'number': {
						validators: {
							notEmpty: {
								message: 'Please provide a valid phone number'
							}
						}
					},
					'socials': {
						validators: {
							notEmpty: {
								message: 'Please select how you heard about us'
							}
						}
					}
				},
				plugins: {
					trigger: new FormValidation.plugins.Trigger(),
					// Bootstrap Framework Integration
					bootstrap: new FormValidation.plugins.Bootstrap5({
						rowSelector: '.fv-row',
                        eleInvalidClass: '',
                        eleValidClass: ''
					})
				}
			}
		));

		// Step 3
		validations.push(FormValidation.formValidation(
			form,
			{
				fields: {
					'business_name': {
						validators: {
							notEmpty: {
								message: 'Busines name is required'
							}
						}
					},
					'business_descriptor': {
						validators: {
							notEmpty: {
								message: 'Busines descriptor is required'
							}
						}
					},
					'business_type': {
						validators: {
							notEmpty: {
								message: 'Busines type is required'
							}
						}
					},
					'business_email': {
						validators: {
							notEmpty: {
								message: 'Busines email is required'
							},
							emailAddress: {
								message: 'The value is not a valid email address'
							}
						}
					}
				},
				plugins: {
					trigger: new FormValidation.plugins.Trigger(),
					// Bootstrap Framework Integration
					bootstrap: new FormValidation.plugins.Bootstrap5({
						rowSelector: '.fv-row',
                        eleInvalidClass: '',
                        eleValidClass: ''
					})
				}
			}
		));

		// Step 4
		validations.push(FormValidation.formValidation(
			form,
			{
				// card details is not a must
				fields: {
					'card_name': {
						validators: {
							notEmpty: {
								message: 'Name on card is required'
							}
						}
					},
					'card_number': {
						validators: {
							notEmpty: {
								message: 'Card member is required'
							},
                            creditCard: {
                                message: 'Card number is not valid'
                            }
						}
					},
					'card_expiry_month': {
						validators: {
							notEmpty: {
								message: 'Month is required'
							}
						}
					},
					'card_expiry_year': {
						validators: {
							notEmpty: {
								message: 'Year is required'
							}
						}
					},
					'card_cvv': {
						validators: {
							notEmpty: {
								message: 'CVV is required'
							},
							digits: {
								message: 'CVV must contain only digits'
							},
							stringLength: {
								min: 3,
								max: 4,
								message: 'CVV must contain 3 to 4 digits only'
							}
						}
					}
				},

				plugins: {
					trigger: new FormValidation.plugins.Trigger(),
					// Bootstrap Framework Integration
					bootstrap: new FormValidation.plugins.Bootstrap5({
						rowSelector: '.fv-row',
                        eleInvalidClass: '',
                        eleValidClass: ''
					})
				}
			}
		));
	}

	return {
		// Public Functions
		init: function () {
			
			// Elements
			modalEl = document.querySelector('#kt_modal_create_account');

			if ( modalEl ) {
				modal = new bootstrap.Modal(modalEl);	
			}					

			stepper = document.querySelector('#kt_create_account_stepper');

			if ( !stepper ) {
				return;
			}

			form = stepper.querySelector('#kt_create_account_form');
			formSubmitButton = stepper.querySelector('[data-kt-stepper-action="submit"]');
			formContinueButton = stepper.querySelector('[data-kt-stepper-action="next"]');

			initStepper();
			initValidation();
			// handleForm();
		},
	};
}();

// On document ready
KTUtil.onDOMContentLoaded(function() {
    KTCreateAccount.init();
});