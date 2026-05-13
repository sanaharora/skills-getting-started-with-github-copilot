document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function displayMessage(text, type = "info") {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      activitiesList.innerHTML = "";
      activitySelect.innerHTML = "<option value=\"\">-- Select an activity --</option>";

      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const participantsHtml = details.participants
          .map((email) => {
            return `
              <li>
                <span>${email}</span>
                <button class="participant-delete-button" data-activity="${name}" data-email="${email}" aria-label="Remove ${email}">×</button>
              </li>
            `;
          })
          .join("");

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <p><strong>Current Participants:</strong></p>
          <ul class="participants-list">
            ${participantsHtml}
          </ul>
        `;

        activitiesList.appendChild(activityCard);

        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  async function unregisterParticipant(activity, email) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );

      const result = await response.json();
      if (response.ok) {
        displayMessage(result.message, "success");
        await fetchActivities();
      } else {
        displayMessage(result.detail || "Failed to remove participant", "error");
      }
    } catch (error) {
      displayMessage("Unable to remove participant. Please try again.", "error");
      console.error("Error removing participant:", error);
    }
  }

  activitiesList.addEventListener("click", (event) => {
    const deleteButton = event.target.closest(".participant-delete-button");
    if (!deleteButton) return;

    const activity = deleteButton.dataset.activity;
    const email = deleteButton.dataset.email;
    unregisterParticipant(activity, email);
  });

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );

      const result = await response.json();
      if (response.ok) {
        displayMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        displayMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      displayMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  fetchActivities();
});
