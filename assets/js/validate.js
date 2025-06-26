/**
 * Custom Contact Form Handler for Formspree
 * Handles validation, submission, and UI feedback
 */
(function () {
  "use strict";

  // Configuration
  const CONFIG = {
    loadingText: "Sending...",
    successMessage: "Thank you! Your message has been sent successfully.",
    errorMessage: "Oops! Something went wrong. Please try again.",
    validationMessages: {
      name: "Please enter your name",
      email: "Please enter a valid email address",
      subject: "Please enter a subject",
      message: "Please enter your message",
    },
  };

  // Initialize form handler when DOM is loaded
  document.addEventListener("DOMContentLoaded", function () {
    const contactForm = document.querySelector('form[action*="formspree.io"]');
    if (contactForm) {
      new ContactFormHandler(contactForm);
    }
  });

  class ContactFormHandler {
    constructor(form) {
      this.form = form;
      this.setupElements();
      this.attachEventListeners();
    }

    setupElements() {
      // Get form elements
      this.nameField = this.form.querySelector('input[name="name"]');
      this.emailField = this.form.querySelector('input[name="email"]');
      this.subjectField = this.form.querySelector('input[name="subject"]');
      this.messageField = this.form.querySelector('textarea[name="message"]');
      this.submitButton = this.form.querySelector('button[type="submit"]');

      // Get or create status elements
      this.loadingElement = this.form.querySelector(".loading") || this.createStatusElement("loading");
      this.errorElement = this.form.querySelector(".error-message") || this.createStatusElement("error-message");
      this.successElement = this.form.querySelector(".sent-message") || this.createStatusElement("sent-message");

      // Store original button text
      this.originalButtonText = this.submitButton.textContent;
    }

    createStatusElement(className) {
      const element = document.createElement("div");
      element.className = className;
      element.style.display = "none";
      element.style.padding = "10px";
      element.style.marginTop = "10px";
      element.style.marginBottom = "10px";
      element.style.borderRadius = "4px";

      // Add specific styling based on type
      if (className === "loading") {
        element.style.backgroundColor = "#e3f2fd";
        element.style.color = "#1976d2";
        element.style.border = "1px solid #bbdefb";
      } else if (className === "error-message") {
        element.style.backgroundColor = "#ffebee";
        element.style.color = "#c62828";
        element.style.border = "1px solid #ffcdd2";
      } else if (className === "sent-message") {
        element.style.backgroundColor = "#e8f5e8";
        element.style.color = "#2e7d32";
        element.style.border = "1px solid #c8e6c9";
      }

      // Insert before submit button
      this.submitButton.parentNode.insertBefore(element, this.submitButton);
      return element;
    }

    attachEventListeners() {
      // Form submission
      this.form.addEventListener("submit", (e) => this.handleSubmit(e));

      // Real-time validation
      this.nameField?.addEventListener("blur", () => this.validateField(this.nameField, "name"));
      this.emailField?.addEventListener("blur", () => this.validateField(this.emailField, "email"));
      this.subjectField?.addEventListener("blur", () => this.validateField(this.subjectField, "subject"));
      this.messageField?.addEventListener("blur", () => this.validateField(this.messageField, "message"));

      // Clear validation on input
      [this.nameField, this.emailField, this.subjectField, this.messageField].forEach((field) => {
        if (field) {
          field.addEventListener("input", () => this.clearFieldError(field));
        }
      });
    }

    validateField(field, type) {
      if (!field) return true;

      const value = field.value.trim();
      let isValid = true;
      let errorMessage = "";

      switch (type) {
        case "name":
          isValid = value.length;
          errorMessage = CONFIG.validationMessages.name;
          break;
        case "email":
          isValid = this.isValidEmail(value);
          errorMessage = CONFIG.validationMessages.email;
          break;
        case "subject":
          isValid = value.length;
          errorMessage = CONFIG.validationMessages.subject;
          break;
        case "message":
          isValid = value.length;
          errorMessage = CONFIG.validationMessages.message;
          break;
      }

      if (!isValid) {
        this.showFieldError(field, errorMessage);
      } else {
        this.clearFieldError(field);
      }

      return isValid;
    }

    isValidEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }

    showFieldError(field, message) {
      this.clearFieldError(field);

      field.style.borderColor = "#dc3545";
      field.classList.add("is-invalid");

      const errorDiv = document.createElement("div");
      errorDiv.className = "field-error";
      errorDiv.style.color = "#dc3545";
      errorDiv.style.fontSize = "0.875em";
      errorDiv.style.marginTop = "5px";
      errorDiv.textContent = message;

      field.parentNode.appendChild(errorDiv);
    }

    clearFieldError(field) {
      field.style.borderColor = "";
      field.classList.remove("is-invalid");

      const errorDiv = field.parentNode.querySelector(".field-error");
      if (errorDiv) {
        errorDiv.remove();
      }
    }

    validateForm() {
      const validations = [this.validateField(this.nameField, "name"), this.validateField(this.emailField, "email"), this.validateField(this.subjectField, "subject"), this.validateField(this.messageField, "message")];

      return validations.every((isValid) => isValid);
    }

    async handleSubmit(e) {
      e.preventDefault();

      // Clear previous messages
      this.hideAllMessages();

      // Validate form
      if (!this.validateForm()) {
        this.showError("Please fix the errors above and try again.");
        return;
      }

      // Show loading state
      this.showLoading();

      try {
        const formData = new FormData(this.form);
        const response = await fetch(this.form.action, {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
          },
        });

        const data = await response.json();

        if (response.ok && data.ok) {
          this.showSuccess();
          this.form.reset();
          this.clearAllFieldErrors();
        } else {
          throw new Error(data.error || "Submission failed");
        }
      } catch (error) {
        console.error("Form submission error:", error);
        this.showError(error.message || CONFIG.errorMessage);
      } finally {
        this.hideLoading();
      }
    }

    showLoading() {
      this.loadingElement.style.display = "block";
      this.loadingElement.textContent = CONFIG.loadingText;
      this.submitButton.disabled = true;
      this.submitButton.textContent = CONFIG.loadingText;
    }

    hideLoading() {
      this.loadingElement.style.display = "none";
      this.submitButton.disabled = false;
      this.submitButton.textContent = this.originalButtonText;
    }

    showSuccess() {
      this.successElement.style.display = "block";
      this.successElement.textContent = CONFIG.successMessage;

      // Auto-hide after 5 seconds
      setTimeout(() => {
        this.successElement.style.display = "none";
      }, 5000);
    }

    showError(message) {
      this.errorElement.style.display = "block";
      this.errorElement.textContent = message || CONFIG.errorMessage;
    }

    hideAllMessages() {
      this.loadingElement.style.display = "none";
      this.errorElement.style.display = "none";
      this.successElement.style.display = "none";
    }

    clearAllFieldErrors() {
      [this.nameField, this.emailField, this.subjectField, this.messageField].forEach((field) => {
        if (field) {
          this.clearFieldError(field);
        }
      });
    }
  }

  // Make it globally available if needed
  window.ContactFormHandler = ContactFormHandler;
})();
