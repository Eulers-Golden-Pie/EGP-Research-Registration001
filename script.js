"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registrationForm");

  const childrenContainer =
    document.getElementById("childrenContainer");

  const childTemplate =
    document.getElementById("childTemplate");

  const addChildButton =
    document.getElementById("addChildButton");

  const formMessage =
    document.getElementById("formMessage");

  const submitButton =
    document.getElementById("submitButton");

  const submitButtonText =
    document.getElementById("submitButtonText");

  const submitSpinner =
    document.getElementById("submitSpinner");

  let isSubmitting = false;

  configureBackend();
  addChild();

  addChildButton.addEventListener("click", addChild);

  form.addEventListener("input", (event) => {
    clearInvalidState(event.target);
  });

  form.addEventListener("change", (event) => {
    clearInvalidState(event.target);
  });

  form.addEventListener("submit", handleSubmit);

  /**
   * Confirms that the Apps Script endpoint is configured.
   */
  function configureBackend() {
    const endpoint =
      window.APP_CONFIG?.appsScriptUrl;

    const validEndpoint =
      endpoint &&
      endpoint.startsWith(
        "https://script.google.com/macros/s/"
      ) &&
      endpoint.endsWith("/exec");

    if (!validEndpoint) {
      showMessage(
        "The registration backend has not been configured correctly.",
        "error"
      );

      submitButton.disabled = true;
    }
  }

  /**
   * Adds a new child registration card.
   */
  function addChild() {
    const fragment =
      childTemplate.content.cloneNode(true);

    const childCard =
      fragment.querySelector(".child-card");

    childCard.dataset.childKey =
      createUniqueKey();

    childrenContainer.appendChild(fragment);

    renumberChildren();
    updateRemoveButtons();

    const cards =
      childrenContainer.querySelectorAll(".child-card");

    if (cards.length > 1) {
      const newestCard =
        cards[cards.length - 1];

      newestCard.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

      newestCard
        .querySelector(
          '[data-child-field="firstName"]'
        )
        ?.focus();
    }
  }

  /**
   * Removes one child card.
   */
  function removeChild(childCard) {
    const cards =
      childrenContainer.querySelectorAll(".child-card");

    if (cards.length <= 1) {
      showMessage(
        "At least one participating child must be included.",
        "error"
      );

      return;
    }

    childCard.remove();

    renumberChildren();
    updateRemoveButtons();
    clearMessage();
  }

  /**
   * Updates Child 1, Child 2, etc.
   */
  function renumberChildren() {
    const cards =
      childrenContainer.querySelectorAll(".child-card");

    cards.forEach((card, index) => {
      const childNumber = index + 1;

      const title =
        card.querySelector(".child-title");

      title.textContent =
        `Child ${childNumber}`;

      card
        .querySelectorAll("[data-child-field]")
        .forEach((field) => {
          const fieldName =
            field.dataset.childField;

          field.id =
            `child-${childNumber}-${fieldName}`;

          const label =
            field
              .closest(".field-group")
              ?.querySelector("label");

          if (label) {
            label.htmlFor = field.id;
          }
        });

      const removeButton =
        card.querySelector(
          ".remove-child-button"
        );

      removeButton.onclick =
        () => removeChild(card);

      removeButton.setAttribute(
        "aria-label",
        `Remove Child ${childNumber}`
      );
    });
  }

  /**
   * Hides the remove button when there is only one child.
   */
  function updateRemoveButtons() {
    const cards =
      childrenContainer.querySelectorAll(".child-card");

    cards.forEach((card) => {
      const removeButton =
        card.querySelector(
          ".remove-child-button"
        );

      removeButton.hidden =
        cards.length === 1;
    });
  }

  /**
   * Handles final registration submission.
   */
  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    clearMessage();
    clearAllInvalidStates();

    if (!validateForm()) {
      showMessage(
        "Please complete all required fields and consent statements.",
        "error"
      );

      scrollToFirstInvalid();
      return;
    }

    const endpoint =
      window.APP_CONFIG?.appsScriptUrl;

    if (
      !endpoint ||
      !endpoint.startsWith(
        "https://script.google.com/macros/s/"
      ) ||
      !endpoint.endsWith("/exec")
    ) {
      showMessage(
        "The registration backend has not been configured correctly.",
        "error"
      );

      return;
    }

    const registrationData =
      collectRegistrationData();

    setSubmitting(true);

    try {
      const requestBody =
        new URLSearchParams({
          payload:
            JSON.stringify(registrationData)
        });

      /*
        no-cors allows GitHub Pages to send the request to Apps Script
        without the browser blocking the response redirect.

        The browser cannot inspect Apps Script's response, but Apps Script
        can still save the registration and send the confirmation email.
      */
      await fetch(endpoint, {
        method: "POST",
        mode: "no-cors",
        body: requestBody
      });

      localStorage.removeItem(
        "egpFamilySubmissionToken"
      );

      window.location.assign(
        "pages/success.html"
      );
    } catch (error) {
      console.error(
        "Registration submission error:",
        error
      );

      showMessage(
        "The registration could not be submitted. Please check your internet connection and try again.",
        "error"
      );

      setSubmitting(false);
    }
  }

  /**
   * Validates all required fields and checkboxes.
   */
  function validateForm() {
    let valid = true;

    const regularFields =
      Array.from(
        form.querySelectorAll(
          "input[required]:not([data-child-field]), " +
          "select[required]:not([data-child-field]), " +
          "textarea[required]:not([data-child-field])"
        )
      );

    regularFields.forEach((field) => {
      if (!validateField(field)) {
        valid = false;
      }
    });

    const childCards =
      childrenContainer.querySelectorAll(
        ".child-card"
      );

    if (childCards.length < 1) {
      valid = false;
    }

    childCards.forEach((card) => {
      const requiredChildFields =
        card.querySelectorAll(
          "[data-child-field][required]"
        );

      requiredChildFields.forEach((field) => {
        if (!validateField(field)) {
          valid = false;
        }
      });
    });

    return valid;
  }

  /**
   * Validates one field.
   */
  function validateField(field) {
    let valid = true;

    if (field.type === "checkbox") {
      valid = field.checked;
    } else {
      valid =
        field.checkValidity() &&
        String(field.value).trim() !== "";
    }

    if (
      field.dataset.childField === "age" &&
      field.value
    ) {
      const age =
        Number(field.value);

      valid =
        Number.isInteger(age) &&
        age >= 5 &&
        age <= 17;
    }

    if (
      field.type === "email" &&
      field.value
    ) {
      valid =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          .test(field.value.trim());
    }

    if (!valid) {
      setInvalidState(field);
    }

    return valid;
  }

  /**
   * Marks a field as invalid.
   */
  function setInvalidState(field) {
    field.classList.add("invalid");

    field.setAttribute(
      "aria-invalid",
      "true"
    );

    if (field.type === "checkbox") {
      field
        .closest(".checkbox-card")
        ?.classList.add("invalid");
    }
  }

  /**
   * Removes invalid styling.
   */
  function clearInvalidState(field) {
    if (!(field instanceof HTMLElement)) {
      return;
    }

    field.classList.remove("invalid");

    field.removeAttribute(
      "aria-invalid"
    );

    if (field.type === "checkbox") {
      field
        .closest(".checkbox-card")
        ?.classList.remove("invalid");
    }
  }

  /**
   * Clears every invalid marker.
   */
  function clearAllInvalidStates() {
    form
      .querySelectorAll(".invalid")
      .forEach((element) => {
        element.classList.remove("invalid");

        element.removeAttribute(
          "aria-invalid"
        );
      });
  }

  /**
   * Scrolls to the first incomplete field.
   */
  function scrollToFirstInvalid() {
    const firstInvalid =
      form.querySelector(".invalid");

    firstInvalid?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

    if (
      firstInvalid &&
      typeof firstInvalid.focus ===
        "function"
    ) {
      setTimeout(() => {
        firstInvalid.focus({
          preventScroll: true
        });
      }, 350);
    }
  }

  /**
   * Collects the complete family registration.
   */
  function collectRegistrationData() {
    return {
      submissionToken:
        getOrCreateSubmissionToken(),

      parent: {
        firstName:
          cleanValue("parentFirstName"),

        lastName:
          cleanValue("parentLastName"),

        email:
          cleanValue(
            "parentEmail"
          ).toLowerCase(),

        phone:
          cleanValue("parentPhone"),

        relationship:
          cleanValue(
            "parentRelationship"
          ),

        city:
          cleanValue("city")
      },

      children:
        collectChildren(),

      consent: {
        pisRead:
          getChecked("pisRead"),

        guardianAuthority:
          getChecked(
            "guardianAuthority"
          ),

        understandsActivities:
          getChecked(
            "understandsActivities"
          ),

        voluntaryParticipation:
          getChecked(
            "voluntaryParticipation"
          ),

        parentPermission:
          getChecked(
            "parentPermission"
          ),

        studentAssentAcknowledgment:
          getChecked(
            "studentAssentAcknowledgment"
          ),

        dataUsePermission:
          getChecked(
            "dataUsePermission"
          ),

        whatsappPermission:
          getChecked(
            "whatsappPermission"
          ),

        photoPermission:
          getChecked(
            "photoPermission"
          ),

        videoPermission:
          getChecked(
            "videoPermission"
          ),

        accuracyConfirmation:
          getChecked(
            "accuracyConfirmation"
          )
      },

      website:
        cleanValue("website"),

      submittedAt:
        new Date().toISOString(),

      sourcePage:
        window.location.href
    };
  }

  /**
   * Collects each child card into an array.
   */
  function collectChildren() {
    return Array.from(
      childrenContainer.querySelectorAll(
        ".child-card"
      )
    ).map((card) => {
      const fieldValue =
        (name) =>
          String(
            card.querySelector(
              `[data-child-field="${name}"]`
            )?.value ?? ""
          ).trim();

      return {
        firstName:
          fieldValue("firstName"),

        lastName:
          fieldValue("lastName"),

        age:
          fieldValue("age"),

        gradeLevel:
          fieldValue("gradeLevel"),

        schoolName:
          fieldValue("schoolName"),

        accommodations:
          fieldValue("accommodations")
      };
    });
  }

  /**
   * Reads and trims a normal form input.
   */
  function cleanValue(id) {
    return String(
      document.getElementById(id)?.value ??
        ""
    ).trim();
  }

  /**
   * Reads a checkbox.
   */
  function getChecked(id) {
    return Boolean(
      document.getElementById(id)?.checked
    );
  }

  /**
   * Generates a duplicate-protection token.
   */
  function getOrCreateSubmissionToken() {
    let token =
      localStorage.getItem(
        "egpFamilySubmissionToken"
      );

    if (!token) {
      token =
        window.crypto?.randomUUID?.() ||
        `${Date.now()}-${Math.random()
          .toString(16)
          .slice(2)}`;

      localStorage.setItem(
        "egpFamilySubmissionToken",
        token
      );
    }

    return token;
  }

  /**
   * Generates an internal key for child cards.
   */
  function createUniqueKey() {
    return (
      window.crypto?.randomUUID?.() ||
      `${Date.now()}-${Math.random()
        .toString(16)
        .slice(2)}`
    );
  }

  /**
   * Controls loading state.
   */
  function setSubmitting(submitting) {
    isSubmitting = submitting;

    submitButton.disabled =
      submitting;

    submitButtonText.textContent =
      submitting
        ? "Submitting registration…"
        : "Submit registration";

    submitSpinner.classList.toggle(
      "hidden",
      !submitting
    );
  }

  /**
   * Displays an error or success message.
   */
  function showMessage(message, type) {
    formMessage.textContent = message;

    formMessage.className =
      `message message-${
        type === "success"
          ? "success"
          : "error"
      }`;

    formMessage.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }

  /**
   * Clears the message box.
   */
  function clearMessage() {
    formMessage.textContent = "";

    formMessage.className =
      "message hidden";
  }
});
