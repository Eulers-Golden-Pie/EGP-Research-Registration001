"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registrationForm");
  const steps = Array.from(document.querySelectorAll(".form-step"));

  const nextButtons = document.querySelectorAll(".next-button");
  const backButtons = document.querySelectorAll(".back-button");

  const progressText = document.getElementById("progressText");
  const progressPercent = document.getElementById("progressPercent");
  const progressBar = document.getElementById("progressBar");

  const formMessage = document.getElementById("formMessage");

  const adultFields = document.getElementById("adultFields");
  const studentFields = document.getElementById("studentFields");
  const adultConsent = document.getElementById("adultConsent");
  const studentConsent = document.getElementById("studentConsent");

  const detailsHeading = document.getElementById("detailsHeading");
  const detailsDescription = document.getElementById(
    "detailsDescription"
  );

  const photoPermissionText = document.getElementById(
    "photoPermissionText"
  );

  const videoPermissionText = document.getElementById(
    "videoPermissionText"
  );

  const reviewSummary = document.getElementById("reviewSummary");

  const submitButton = document.getElementById("submitButton");
  const submitButtonText = document.getElementById(
    "submitButtonText"
  );

  const submitSpinner = document.getElementById("submitSpinner");

  let currentStep = 1;
  let isSubmitting = false;

  setMinimumDate();
  updateProgress();

  nextButtons.forEach((button) => {
    button.addEventListener("click", () => {
      clearMessage();

      if (!validateStep(currentStep)) {
        scrollToFirstInvalid();
        return;
      }

      if (currentStep === 1) {
        updateParticipantBranch();
      }

      if (currentStep === 4) {
        buildReviewSummary();
      }

      goToStep(currentStep + 1);
    });
  });

  backButtons.forEach((button) => {
    button.addEventListener("click", () => {
      clearMessage();
      goToStep(currentStep - 1);
    });
  });

  document
    .querySelectorAll('input[name="participantType"]')
    .forEach((radio) => {
      radio.addEventListener("change", () => {
        document
          .getElementById("participantTypeError")
          .classList.add("hidden");

        updateParticipantBranch();
      });
    });

  form.addEventListener("input", (event) => {
    clearInvalidState(event.target);
  });

  form.addEventListener("change", (event) => {
    clearInvalidState(event.target);
  });

  form.addEventListener("submit", handleSubmit);

  function getParticipantType() {
    return (
      form.querySelector(
        'input[name="participantType"]:checked'
      )?.value || ""
    );
  }

  function updateParticipantBranch() {
    const participantType = getParticipantType();
    const isAdult = participantType === "adult";
    const isStudent = participantType === "student";

    adultFields.classList.toggle("hidden", !isAdult);
    adultConsent.classList.toggle("hidden", !isAdult);

    studentFields.classList.toggle("hidden", !isStudent);
    studentConsent.classList.toggle("hidden", !isStudent);

    toggleBranchRequirements("adult", isAdult);
    toggleBranchRequirements("student", isStudent);

    if (isAdult) {
      detailsHeading.textContent = "Adult participant details";

      detailsDescription.textContent =
        "Enter the adult participant's contact and session information.";

      photoPermissionText.textContent =
        "I agree to be photographed during the study.";

      videoPermissionText.textContent =
        "I agree to be video recorded during the study.";
    }

    if (isStudent) {
      detailsHeading.textContent =
        "Parent and student details";

      detailsDescription.textContent =
        "A parent or legal guardian must complete this registration.";

      photoPermissionText.textContent =
        "I give permission for the student to be photographed during the study.";

      videoPermissionText.textContent =
        "I give permission for the student to be video recorded during the study.";
    }
  }

  function toggleBranchRequirements(branch, enabled) {
    document
      .querySelectorAll(`[data-required-for="${branch}"]`)
      .forEach((field) => {
        field.required = enabled;
        field.disabled = !enabled;

        if (!enabled) {
          clearInvalidState(field);
        }
      });
  }

  function goToStep(stepNumber) {
    if (stepNumber < 1 || stepNumber > steps.length) {
      return;
    }

    currentStep = stepNumber;

    steps.forEach((step) => {
      step.classList.toggle(
        "active",
        Number(step.dataset.step) === currentStep
      );
    });

    updateProgress();

    window.scrollTo({
      top: document.querySelector(".form-card").offsetTop - 20,
      behavior: "smooth"
    });
  }

  function updateProgress() {
    const percent = Math.round(
      (currentStep / steps.length) * 100
    );

    progressText.textContent =
      `Step ${currentStep} of ${steps.length}`;

    progressPercent.textContent = `${percent}%`;
    progressBar.style.width = `${percent}%`;
  }

  function validateStep(stepNumber) {
    const step = steps.find(
      (item) => Number(item.dataset.step) === stepNumber
    );

    if (!step) {
      return false;
    }

    clearStepInvalidStates(step);

    if (stepNumber === 1 && !getParticipantType()) {
      document
        .getElementById("participantTypeError")
        .classList.remove("hidden");

      return false;
    }

    const fields = Array.from(
      step.querySelectorAll(
        "input:not(:disabled), select:not(:disabled), textarea:not(:disabled)"
      )
    );

    let isValid = true;

    fields.forEach((field) => {
      if (!validateField(field)) {
        isValid = false;
      }
    });

    if (!isValid) {
      showMessage(
        "Please complete all required fields before continuing.",
        "error"
      );
    }

    return isValid;
  }

  function validateField(field) {
    if (!field.required) {
      return true;
    }

    let valid = true;

    if (field.type === "checkbox") {
      valid = field.checked;
    } else if (field.type === "radio") {
      valid = Boolean(
        form.querySelector(
          `input[name="${cssEscape(field.name)}"]:checked`
        )
      );
    } else {
      valid = field.checkValidity() &&
        String(field.value).trim() !== "";
    }

    if (field.id === "studentAge" && field.value) {
      const age = Number(field.value);
      valid = age >= 6 && age <= 17;
    }

    if (field.type === "email" && field.value) {
      valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        field.value.trim()
      );
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
      field.closest(".checkbox-row")?.classList.add("invalid");
    }
  }

  function clearInvalidState(field) {
    if (!(field instanceof HTMLElement)) {
      return;
    }

    field.classList.remove("invalid");
    field.removeAttribute("aria-invalid");

    if (field.type === "checkbox") {
      field.closest(".checkbox-row")?.classList.remove("invalid");
    }
  }

  function clearStepInvalidStates(step) {
    step.querySelectorAll(".invalid").forEach((element) => {
      element.classList.remove("invalid");
      element.removeAttribute("aria-invalid");
    });
  }

  function scrollToFirstInvalid() {
    const firstInvalid =
      document.querySelector(
        ".form-step.active .invalid, .form-step.active .field-error:not(.hidden)"
      );

    firstInvalid?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }

  function buildReviewSummary() {
    const data = collectFormData();
    const isAdult = data.participantType === "adult";

    const participantRows = isAdult
      ? [
          ["Participant type", "Adult participant"],
          [
            "Participant name",
            `${data.adultFirstName} ${data.adultLastName}`
          ],
          ["Email", data.adultEmail],
          ["Phone", data.adultPhone],
          ["Age range", data.adultAgeRange]
        ]
      : [
          ["Participant type", "Student participant"],
          [
            "Student name",
            `${data.studentFirstName} ${data.studentLastName}`
          ],
          ["Student age", data.studentAge],
          ["Grade level", formatGrade(data.gradeLevel)],
          ["School", data.schoolName || "Not provided"]
        ];

    const parentRows = isAdult
      ? []
      : [
          [
            "Parent/guardian",
            `${data.parentFirstName} ${data.parentLastName}`
          ],
          ["Relationship", data.parentRelationship],
          ["Parent email", data.parentEmail],
          ["Parent phone", data.parentPhone]
        ];

    const sessionRows = [
      ["Preferred date", formatDate(data.preferredDate)],
      ["Preferred time", data.preferredTime],
      [
        "Accessibility needs",
        data.accessibilityNotes || "None provided"
      ]
    ];

    const permissionRows = [
      [
        "Participant Information Sheet",
        data.pisRead ? "Confirmed" : "Not confirmed"
      ],
      [
        "Photo permission",
        data.photoPermission ? "Yes" : "No"
      ],
      [
        "Video permission",
        data.videoPermission ? "Yes" : "No"
      ]
    ];

    reviewSummary.innerHTML = [
      createReviewSection("Participant", participantRows),
      parentRows.length
        ? createReviewSection(
            "Parent or legal guardian",
            parentRows
          )
        : "",
      createReviewSection("Session", sessionRows),
      createReviewSection("Permissions", permissionRows)
    ].join("");
  }

  function createReviewSection(title, rows) {
    const items = rows.map(([label, value]) => `
      <div class="review-item">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(String(value || "—"))}</strong>
      </div>
    `).join("");

    return `
      <section class="review-section">
        <h3>${escapeHtml(title)}</h3>
        <div class="review-grid">${items}</div>
      </section>
    `;
  }

  function collectFormData() {
    const formData = new FormData(form);

    const checkboxValue = (name) =>
      formData.get(name) === "Yes";

    return {
      submissionToken: getOrCreateSubmissionToken(),
      studyId: window.APP_CONFIG?.studyId || "EGP-2026-001",
      formVersion: window.APP_CONFIG?.formVersion || "1.0",

      participantType: clean(formData.get("participantType")),

      adultFirstName: clean(formData.get("adultFirstName")),
      adultLastName: clean(formData.get("adultLastName")),
      adultEmail: clean(formData.get("adultEmail")),
      adultPhone: clean(formData.get("adultPhone")),
      adultAgeRange: clean(formData.get("adultAgeRange")),

      parentFirstName: clean(formData.get("parentFirstName")),
      parentLastName: clean(formData.get("parentLastName")),
      parentRelationship: clean(
        formData.get("parentRelationship")
      ),
      parentEmail: clean(formData.get("parentEmail")),
      parentPhone: clean(formData.get("parentPhone")),

      studentFirstName: clean(
        formData.get("studentFirstName")
      ),
      studentLastName: clean(
        formData.get("studentLastName")
      ),
      studentAge: clean(formData.get("studentAge")),
      gradeLevel: clean(formData.get("gradeLevel")),
      schoolName: clean(formData.get("schoolName")),

      preferredDate: clean(formData.get("preferredDate")),
      preferredTime: clean(formData.get("preferredTime")),
      accessibilityNotes: clean(
        formData.get("accessibilityNotes")
      ),

      pisRead: checkboxValue("pisRead"),

      adultVoluntaryConsent: checkboxValue(
        "adultVoluntaryConsent"
      ),
      adultWithdrawalConsent: checkboxValue(
        "adultWithdrawalConsent"
      ),
      adultParticipationConsent: checkboxValue(
        "adultParticipationConsent"
      ),
      adultAccuracyConfirmation: checkboxValue(
        "adultAccuracyConfirmation"
      ),

      guardianAuthority: checkboxValue("guardianAuthority"),
      parentUnderstandsStudy: checkboxValue(
        "parentUnderstandsStudy"
      ),
      parentVoluntaryConsent: checkboxValue(
        "parentVoluntaryConsent"
      ),
      parentParticipationConsent: checkboxValue(
        "parentParticipationConsent"
      ),
      studentAssent: checkboxValue("studentAssent"),

      photoPermission: checkboxValue("photoPermission"),
      videoPermission: checkboxValue("videoPermission"),
      finalConfirmation: checkboxValue("finalConfirmation"),

      website: clean(formData.get("website")),

      clientSubmittedAt: new Date().toISOString(),
      sourcePage: window.location.href,
      userAgent: navigator.userAgent
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    clearMessage();

    if (!validateStep(5)) {
      scrollToFirstInvalid();
      return;
    }

    const endpoint = window.APP_CONFIG?.appsScriptUrl;

    if (
      !endpoint ||
      endpoint.includes("PASTE_YOUR_GOOGLE_APPS_SCRIPT")
    ) {
      showMessage(
        "The Google Sheets connection has not been configured yet. Add the deployed Apps Script URL to config.js.",
        "error"
      );

      return;
    }

    const data = collectFormData();

    if (!validateCompleteSubmission(data)) {
      showMessage(
        "Some required consent or participant information is missing. Please return to the earlier steps and review the form.",
        "error"
      );

      return;
    }

    setSubmitting(true);

    try {
      /*
        URLSearchParams creates a simple form-encoded POST request.
        Do not add custom request headers here, because that may trigger
        an unnecessary browser preflight request.
      */
      const response = await fetch(endpoint, {
        method: "POST",
        body: new URLSearchParams({
          payload: JSON.stringify(data)
        }),
        redirect: "follow"
      });

      if (!response.ok) {
        throw new Error(
          `Submission failed with status ${response.status}.`
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.message || "The registration could not be saved."
        );
      }

      sessionStorage.setItem(
        "egpRegistrationResult",
        JSON.stringify({
          participantId: result.participantId,
          duplicate: Boolean(result.duplicate)
        })
      );

      localStorage.removeItem("egpSubmissionToken");

      const destination =
        window.APP_CONFIG?.successPageUrl ||
        "pages/success.html";

      window.location.assign(
        `${destination}?participantId=${encodeURIComponent(
          result.participantId
        )}`
      );
    } catch (error) {
      console.error(error);

      showMessage(
        "We could not confirm that your registration was saved. Please check your internet connection and try once more. Do not repeatedly click submit.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  }

  function validateCompleteSubmission(data) {
    if (
      !data.participantType ||
      !data.preferredDate ||
      !data.preferredTime ||
      !data.pisRead ||
      !data.finalConfirmation
    ) {
      return false;
    }

    if (data.participantType === "adult") {
      return Boolean(
        data.adultFirstName &&
        data.adultLastName &&
        data.adultEmail &&
        data.adultPhone &&
        data.adultAgeRange &&
        data.adultVoluntaryConsent &&
        data.adultWithdrawalConsent &&
        data.adultParticipationConsent &&
        data.adultAccuracyConfirmation
      );
    }

    if (data.participantType === "student") {
      const age = Number(data.studentAge);

      return Boolean(
        data.parentFirstName &&
        data.parentLastName &&
        data.parentRelationship &&
        data.parentEmail &&
        data.parentPhone &&
        data.studentFirstName &&
        data.studentLastName &&
        age >= 6 &&
        age <= 17 &&
        data.gradeLevel &&
        data.guardianAuthority &&
        data.parentUnderstandsStudy &&
        data.parentVoluntaryConsent &&
        data.parentParticipationConsent &&
        data.studentAssent
      );
    }

    return false;
  }

  function setSubmitting(submitting) {
    isSubmitting = submitting;
    submitButton.disabled = submitting;

    submitButtonText.textContent = submitting
      ? "Submitting…"
      : "Submit registration";

    submitSpinner.classList.toggle("hidden", !submitting);
  }

  function showMessage(message, type) {
    formMessage.textContent = message;
    formMessage.className =
      `message message-${type === "success" ? "success" : "error"}`;

    formMessage.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }

  function clearMessage() {
    formMessage.textContent = "";
    formMessage.className = "message hidden";
  }

  function getOrCreateSubmissionToken() {
    let token = localStorage.getItem("egpSubmissionToken");

    if (!token) {
      token = crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()
            .toString(16)
            .slice(2)}`;

      localStorage.setItem("egpSubmissionToken", token);
    }

    return token;
  }

  function setMinimumDate() {
    const dateInput = document.getElementById("preferredDate");

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    dateInput.min = `${year}-${month}-${day}`;
  }

  function formatDate(value) {
    if (!value) {
      return "Not selected";
    }

    const date = new Date(`${value}T12:00:00`);

    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(date);
  }

  function formatGrade(value) {
    if (!value) {
      return "Not provided";
    }

    if (value === "Other") {
      return "Other";
    }

    return `Grade ${value}`;
  }

  function clean(value) {
    return String(value ?? "").trim();
  }

  function escapeHtml(value) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function cssEscape(value) {
    if (window.CSS?.escape) {
      return CSS.escape(value);
    }

    return value.replace(/["\\]/g, "\\$&");
  }
});
