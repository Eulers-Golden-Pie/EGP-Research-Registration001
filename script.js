"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registrationForm");
  const childrenContainer =
    document.getElementById("childrenContainer");

  const childTemplate =
    document.getElementById("childTemplate");

  const addChildButton =
    document.getElementById("addChildButton");

  const payloadInput =
    document.getElementById("payload");

  const formMessage =
    document.getElementById("formMessage");

  const submitButton =
    document.getElementById("submitButton");

  const submitButtonText =
    document.getElementById("submitButtonText");

  const submitSpinner =
    document.getElementById("submitSpinner");

  let childCount = 0;
  let isSubmitting = false;

  configureFormEndpoint();
  addChild();

  addChildButton.addEventListener("click", addChild);

  form.addEventListener("input", (event) => {
    clearInvalidState(event.target);
  });

  form.addEventListener("change", (event) => {
    clearInvalidState(event.target);
  });

  form.addEventListener("submit", handleSubmit);

  function configureFormEndpoint() {
    const endpoint = window.APP_CONFIG?.appsScriptUrl;

    if (
      !endpoint ||
      !endpoint.startsWith("https://script.google.com/macros/s/") ||
      !endpoint.endsWith("/exec")
    ) {
      showMessage(
        "The registration backend has not been configured correctly.",
        "error"
      );

      submitButton.disabled = true;
      return;
    }

    /*
      Traditional browser form submission avoids the cross-origin
      response-reading problem that can occur with fetch() and Apps Script.
    */
    form.action = endpoint;
  }

  function addChild() {
    const fragment =
      childTemplate.content.cloneNode(true);

    const childCard =
      fragment.querySelector(".child-card");

    childCount += 1;

    childCard.dataset.childKey =
      createUniqueKey();

    childrenContainer.appendChild(fragment);

    renumberChildren();
    updateRemoveButtons();

    const newCard =
      childrenContainer.lastElementChild;

    if (childCount > 1) {
      newCard.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

      newCard
        .querySelector('[data-child-field="firstName"]')
        ?.focus();
    }
  }

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
    childCount = childrenContainer
      .querySelectorAll(".child-card").length;

    renumberChildren();
    updateRemoveButtons();
    clearMessage();
  }

  function renumberChildren() {
    const cards =
      childrenContainer.querySelectorAll(".child-card");

    cards.forEach((card, index) => {
      const childNumber = index + 1;

      card.querySelector(".child-title").textContent =
        `Child ${childNumber}`;

      card
        .querySelectorAll("[data-child-field]")
        .forEach((field) => {
          const fieldName =
            field.dataset.childField;

          field.id =
            `child-${childNumber}-${fieldName}`;

          const label =
            field.closest(".field-group")
              ?.querySelector("label");

          if (label) {
            label.htmlFor = field.id;
          }
        });

      const removeButton =
        card.querySelector(".remove-child-button");

      removeButton.onclick = () => removeChild(card);
      removeButton.setAttribute(
        "aria-label",
        `Remove Child ${childNumber}`
      );
    });

    childCount = cards.length;
  }

  function updateRemoveButtons() {
    const cards =
      childrenContainer.querySelectorAll(".child-card");

    cards.forEach((card) => {
      const removeButton =
        card.querySelector(".remove-child-button");

      removeButton.hidden = cards.length === 1;
    });
  }

  function handleSubmit(event) {
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

    const registrationData =
      collectRegistrationData();

    payloadInput.value =
      JSON.stringify(registrationData);

    setSubmitting(true);

    /*
      This submits the browser directly to Apps Script.
      Apps Script saves the rows, sends the email, and then redirects
      the browser to the GitHub confirmation page.
    */
    form.submit();
  }

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
      childrenContainer.querySelectorAll(".child-card");

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
      const age = Number(field.value);

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

  function setInvalidState(field) {
    field.classList.add("invalid");
    field.setAttribute("aria-invalid", "true");

    if (field.type === "checkbox") {
      field
        .closest(".checkbox-card")
        ?.classList.add("invalid");
    }
  }

  function clearInvalidState(field) {
    if (!(field instanceof HTMLElement)) {
      return;
    }

    field.classList.remove("invalid");
    field.removeAttribute("aria-invalid");

    if (field.type === "checkbox") {
      field
        .closest(".checkbox-card")
        ?.classList.remove("invalid");
    }
  }

  function clearAllInvalidStates() {
    form
      .querySelectorAll(".invalid")
      .forEach((element) => {
        element.classList.remove("invalid");
        element.removeAttribute("aria-invalid");
      });
  }

  function scrollToFirstInvalid() {
    const firstInvalid =
      form.querySelector(".invalid");

    firstInvalid?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

    if (
      firstInvalid &&
      typeof firstInvalid.focus === "function"
    ) {
      setTimeout(() => {
        firstInvalid.focus({
          preventScroll: true
        });
      }, 350);
    }
  }

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
          cleanValue("parentEmail").toLowerCase(),

        phone:
          cleanValue("parentPhone"),

        relationship:
          cleanValue("parentRelationship"),

        city:
          cleanValue("city")
      },

      children:
        collectChildren(),

      consent: {
        pisRead:
          getChecked("pisRead"),

        guardianAuthority:
          getChecked("guardianAuthority"),

        understandsActivities:
          getChecked("understandsActivities"),

        voluntaryParticipation:
          getChecked("voluntaryParticipation"),

        parentPermission:
          getChecked("parentPermission"),

        studentAssentAcknowledgment:
          getChecked("studentAssentAcknowledgment"),

        dataUsePermission:
          getChecked("dataUsePermission"),

        whatsappPermission:
          getChecked("whatsappPermission"),

        photoPermission:
          getChecked("photoPermission"),

        videoPermission:
          getChecked("videoPermission"),

        accuracyConfirmation:
          getChecked("accuracyConfirmation")
      },

      website:
        cleanValue("website"),

      submittedAt:
        new Date().toISOString(),

      sourcePage:
        window.location.href
    };
  }

  function collectChildren() {
    return Array.from(
      childrenContainer.querySelectorAll(".child-card")
    ).map((card) => {
      const fieldValue = (name) =>
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

  function cleanValue(id) {
    return String(
      document.getElementById(id)?.value ?? ""
    ).trim();
  }

  function getChecked(id) {
    return Boolean(
      document.getElementById(id)?.checked
    );
  }

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

  function createUniqueKey() {
    return (
      window.crypto?.randomUUID?.() ||
      `${Date.now()}-${Math.random()
        .toString(16)
        .slice(2)}`
    );
  }

  function setSubmitting(submitting) {
    isSubmitting = submitting;
    submitButton.disabled = submitting;

    submitButtonText.textContent =
      submitting
        ? "Submitting registration…"
        : "Submit registration";

    submitSpinner.classList.toggle(
      "hidden",
      !submitting
    );
  }

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

  function clearMessage() {
    formMessage.textContent = "";
    formMessage.className =
      "message hidden";
  }
});
