document.addEventListener("DOMContentLoaded", () => {
  // Greeting elements
  const teachingGreeting = document.getElementById("Pteaching");
  const learningGreeting = document.getElementById("Plearning");
  const profileImg = document.getElementById("profileImgT");
  const profileImgl = document.getElementById("profileImgL");

  // Clear previous courses before adding new ones
  function clearCourses() {
    ["teaching-section", "mycourses-section"].forEach((sectionId) => {
      const completed = document.querySelector(`#${sectionId} .bar.completed`);
      const inProgress = document.querySelector(
        `#${sectionId} .bar.in-progress`
      );
      if (completed) completed.innerHTML = "";
      if (inProgress) inProgress.innerHTML = "";
    });
  }

  async function fetchClasses() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No auth token found, user not authenticated");
        return;
      }

      const response = await fetch("http://localhost/api/class/classes", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Response received:", response.status);

      if (!response.ok) {
        throw new Error(`Failed to fetch classes, status: ${response.status}`);
      }

      const { user_photo, user_name, classes } = await response.json();
      console.log("Classes fetched:", classes);

      // Update localStorage and greetings

      if (teachingGreeting) {
        teachingGreeting.textContent = `Welcome back, ${user_name}. Continue your teaching journey.`;
      }
      if (learningGreeting) {
        learningGreeting.textContent = `Welcome back, ${user_name}. Continue your learning journey.`;
      }

      // Update user photo or set default fallback
      if (profileImg) {
        profileImg.src = user_photo || "image/profil.jpg";
        profileImg.alt = `${user_name}'s profile picture`;
        profileImgl.src = user_photo || "image/profil.jpg";
        profileImgl.alt = `${user_name}'s profile picture`;
      }

      // Clear existing courses first
      clearCourses();

      // Loop through the classes and render them
      classes.forEach((course) => {
        // calculate progress first
        const progress =
          course.duration > 0
            ? Math.round((course.time_gone / course.duration) * 100)
            : 0;

        const isComplete = course.time_gone === course.duration;
        const sectionId =
          course.type === "teacher" ? "teaching-section" : "mycourses-section";
        const profName =
          course.type === "teacher" ? course.receiver_name : course.sender_name;

        const moduleHTML = `
    <div class="module">
      <div class="course">
        <h2>${course.skill_name || "No Skill Name"}</h2>
        <div class="professor-name">${profName || "Unknown"}</div>
        <div class="progress-header">
          <p>Progress</p>
          <span class="pourcentage">${progress}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress" style="width: ${progress}%"></div>
        </div>
        <div class="footer-row">
          <div class="time-left">
            <i class="fas ${
              isComplete ? "fa-check-circle" : "fa-stopwatch"
            }"></i>
            <span>${
              isComplete ? "Completed" : `${course.time_gone}h gone`
            }</span>
          </div>
          <button 
            class="${isComplete ? "certificate-btn" : "continue-btn"}" 
            data-id="${course.class_id || ""}">
            ${isComplete ? "Certificate" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  `;

        const containerSelector = isComplete
          ? ".bar.completed"
          : ".bar.in-progress";
        const container = document.querySelector(
          `#${sectionId} ${containerSelector}`
        );
        if (container) {
          container.insertAdjacentHTML("beforeend", moduleHTML);
          console.log(`Added course to #${sectionId} ${containerSelector}`);
        } else {
          console.warn(
            `Container not found: #${sectionId} ${containerSelector}`
          );
        }
      });
    } catch (error) {
      console.error("Error loading classes:", error);
    }
  }
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("continue-btn")) {
      const classId = e.target.getAttribute("data-id");
      if (classId) {
        localStorage.setItem("currentClassId", classId);
        window.location.href = "timer.html";
      } else {
        console.warn("No class ID found on continue button.");
      }
    }

    if (e.target.classList.contains("certificate-btn")) {
      alert("Certificate button clicked!");
    }
  });

  fetchClasses();
});

function clearCourses() {
  document
    .querySelectorAll(".bar.in-progress, .bar.completed")
    .forEach((bar) => {
      bar.innerHTML = "";
    });
}

function renderCourses(classes) {
  classes.forEach((course) => {
    if (!course.type) return;

    const isTeacher = course.type === "teacher";
    const sectionId = isTeacher ? "teaching-section" : "mycourses-section";
    const profName = isTeacher ? course.receiver_name : course.sender_name;

    const progress =
      course.duration > 0
        ? Math.round((course.time_gone / course.duration) * 100)
        : 0;
    const isComplete = course.time_gone === course.duration;

    const moduleHTML = `
      <div class="module">
        <div class="course">
          <h2>${course.skill_name || "No Skill Name"}</h2>
          <div class="professor-name">${profName || "Unknown"}</div>
          <div class="progress-header">
            <p>Progress</p>
            <span class="pourcentage">${progress}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress" style="width: ${progress}%"></div>
          </div>
          <div class="footer-row">
            <div class="time-left">
              <i class="fas ${
                isComplete ? "fa-check-circle" : "fa-stopwatch"
              }"></i>
              <span>${
                isComplete ? "Completed" : `${course.time_gone}h gone`
              }</span>
            </div>
            <button 
              class="${isComplete ? "certificate-btn" : "continue-btn"}" 
              data-id="${course.class_id || ""}">
              ${isComplete ? "Certificate" : "Continue"}
            </button>
          </div>
        </div>
      </div>`;

    const container = document.querySelector(
      `#${sectionId} .bar.${isComplete ? "completed" : "in-progress"}`
    );
    if (container) {
      container.insertAdjacentHTML("beforeend", moduleHTML);
    } else {
      console.warn(
        `Container not found: #${sectionId} .bar.${
          isComplete ? "completed" : "in-progress"
        }`
      );
    }
  });
}
