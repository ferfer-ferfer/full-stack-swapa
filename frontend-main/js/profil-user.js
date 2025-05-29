//profile informations
function setText(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function fillStars(rating) {   
  const stars = document.querySelectorAll(".rating-stars i");   
  const fullStars = Math.floor(rating || 0); // Handle null/undefined rating
  
  stars.forEach((star, index) => {     
    // Reset classes     
    star.classList.remove("filled");     
    star.className = "fas fa-star"; // Reset to base star class          
    
    if (index < fullStars) {       
      star.classList.add("filled");     
    }   
  }); 
}  

async function loadProfile() {
  /* ---- read token from localStorage ---- */
  const token = localStorage.getItem("token");

  try {
    const resp = await fetch(`http://localhost:80/api/user/profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!resp.ok) throw new Error("HTTP " + resp.status);
    const u = await resp.json();

    /* ---- fill the DOM ---- */
    document.getElementById("userImg").src =
      u.profile_picture || "image/profil.jpg";

    setText("userRealName", `Name: ${u.first_name} ${u.last_name}`);
    setText("userName", `User name: ${u.Users_name}`);
    setText("userAge", `Age: ${u.age}`);
    setText("userAbout", u.about ?? "—");
    
    // Fix for location - using innerHTML instead of textContent to preserve HTML
    const locationElement = document.getElementById("userLocation");
    if (locationElement) {
      locationElement.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${u.location ?? "—"}`;
    }

    /* rating */
    const userRating = u.rating ?? 0;
    document.querySelector(".rating-number").textContent = userRating.toFixed(1);
    fillStars(userRating); // Pass the safe rating value

    /* contacts */
    document.querySelector(".icon-discord").href = u.discord
      ? `https://discord.com/users/${u.discord}`
      : "#";
    document.querySelector(".icon-telegram").href = u.telegram
      ? `https://t.me/${u.telegram}`
      : "#";

    const gmailAnchor = document.querySelector(".icon-gmail");
    if (u.email) {
      gmailAnchor.href = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
        u.email
      )}`;
    } else {
      gmailAnchor.href = "#";
    }
  } catch (err) {
    console.error(err);
    setText("userAbout", "Error loading profile.");
  }
}

document.addEventListener("DOMContentLoaded", loadProfile);

//skills
document.addEventListener("DOMContentLoaded", () => {
  function createSubjectCard(subject) {
    const card = document.createElement("div");
    card.className = "subject-card";
    card.textContent = subject;
    return card;
  }

  /* ---------- render arrays returned by the API -------- */
  function renderSkillCards({ teaching = [], learning = [] }) {
    // clear any old cards
    const teachingContainer = document.getElementById("teachingSubjects");
    const learningContainer = document.getElementById("learningSubjects");
    teachingContainer.innerHTML = "";
    learningContainer.innerHTML = "";

    teaching.forEach((sub) =>
      teachingContainer.appendChild(createSubjectCard(sub.name))
    );
    learning.forEach((sub) =>
      learningContainer.appendChild(createSubjectCard(sub.name))
    );
  }

  async function loadUserSkills() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:80/api/skill/skills`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch skills");

      const skills = await res.json(); // { teaching, learning }
      renderSkillCards(skills);
    } catch (err) {
      console.error("Skill load failed:", err);
    }
  }

  loadUserSkills();
});

//coments
async function loadComments() {
  const token = localStorage.getItem("token");
  const commentCountSpan = document.getElementById("commentCount");
  const commentsList = document.getElementById("commentsList");

  try {
    const res = await fetch(`http://localhost:80/api/comment/comments`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const comments = await res.json();

    commentsList.innerHTML = "";
    commentCountSpan.textContent = comments.length;

    function timeAgo(date) {
      const now = new Date();
      const seconds = Math.floor((now - date) / 1000);
      const intervals = {
        year: 31536000,
        month: 2592000,
        day: 86400,
        hour: 3600,
        minute: 60,
        second: 1,
      };
      for (const unit in intervals) {
        const value = Math.floor(seconds / intervals[unit]);
        if (value >= 1) {
          return `${value} ${unit}${value > 1 ? "s" : ""} ago`;
        }
      }
      return "Just now";
    }

    comments.forEach((comment) => {
      const sender = comment.sender || {};
      const senderName = sender.Users_name
        ? `${sender.first_name} ${sender.last_name}`
        : "Anonymous";

      const avatarUrl = sender.profile_picture || "image/profil.jpg";

      // Parse createdAt safely
      const rawDate = comment.createdAt;
      const createdAt =
        rawDate && !isNaN(new Date(rawDate)) ? new Date(rawDate) : new Date();

      const div = document.createElement("div");
      div.classList.add("comment");
      div.dataset.id = comment.id;
      div.innerHTML = `
        <img class="avatar" src="${avatarUrl}" alt="Avatar">
        <div class="comment-content">
          <span class="username">${senderName}</span> • 
          <span class="time">${timeAgo(createdAt)}</span>
          <p>${comment.comment}</p>
          <div>Rating: ${"★".repeat(Math.round(comment.rating))}${"☆".repeat(
        5 - Math.round(comment.rating)
      )}</div>
        </div>
      `;

      commentsList.appendChild(div);
    });
  } catch (err) {
    console.error("Failed to load comments:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadComments);

// Animation
window.addEventListener("DOMContentLoaded", () => {
  const elements = document.querySelectorAll(".zoom-in");
  elements.forEach((el) => {
    el.classList.add("show");
  });
});

//uploade photo
const penIcon = document.querySelector(".pen");
const fileInput = document.getElementById("uploadImg");
const userImg = document.getElementById("userImg");

penIcon.addEventListener("click", () => {
  fileInput.click(); // Trigger file chooser
});

fileInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (file) {
    // Preview image
    const reader = new FileReader();
    reader.onload = (e) => {
      userImg.src = e.target.result;
    };
    reader.readAsDataURL(file);

    // Upload image to server
    const formData = new FormData();
    formData.append("profile_picture", file);

    try {
      const res = await fetch(
        "http://localhost:80/api/user/upload-profile-picture",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, // Assuming token is stored in localStorage
          },
          body: formData,
        }
      );

      const data = await res.json();
      if (res.ok) {
        console.log("Upload successful:", data.profile_picture);
        userImg.src = data.profile_picture; // Update with actual uploaded image URL
      } else {
        alert("Upload failed: " + data.message);
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Error uploading image");
    }
    window.location.reload();
  }
});

//comment change les info

function closeModal() {
  document.getElementById("edit-profile-modal").classList.add("hidden");
}

function saveProfile() {
  const userName = document.getElementById("edit-userName").value;
  const location = document.getElementById("edit-location").value;
  const about = document.getElementById("edit-about").value;

  document.getElementById("userName").textContent = "User name: " + userName;
  document.getElementById(
    "userLocation"
  ).innerHTML = `<i class="fa-solid fa-location-dot"></i> ${location}`;
  document.getElementById("userAbout").textContent = about;

  closeModal();
}

function showTeachingInput() {
  document.getElementById("new-teaching-subject").style.display = "block";
  document.getElementById("new-teaching-subject").focus();
}

function showLearningInput() {
  document.getElementById("new-learning-subject").style.display = "block";
  document.getElementById("new-learning-subject").focus();
}

// add skill
async function handleSubjectInput(event) {
  if (event.key === "Enter") {
    event.preventDefault();

    const input = event.target;
    const skillName = input.value.trim().toLowerCase();
    if (!skillName) return;

    let type = null;
    if (input.id === "new-teaching-subject") {
      type = "teach";
    } else if (input.id === "new-learning-subject") {
      type = "learn";
    } else {
      console.error("Unknown subject input type");
      return;
    }

    // Check if skill already exists in UI list to prevent duplicate requests
    const listId =
      type === "teach" ? "edit-teaching-list" : "edit-learning-list";
    const list = document.getElementById(listId);
    const existingSkill = Array.from(list.children).find(
      (item) => item.getAttribute("data-skill-name").toLowerCase() === skillName
    );
    if (existingSkill) {
      alert(`You already have this skill added to your ${type} list.`);
      input.value = "";
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:80/api/skill/add-skill", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          skill: skillName,
          type: type,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to add skill");
      }

      // Clear input after successful add
      input.value = "";

      list.appendChild(createSubjectItem(data, type));
    } catch (err) {
      console.error("Error adding skill:", err);
      alert("Could not add skill: " + err.message);
    }
  }
}

// remove skill
async function removeSubjectFromModal(skillId, type) {
  try {
    const token = localStorage.getItem("token");

    // Delete skill by skillId and type (if your backend needs type, add as query param)
    const deleteRes = await fetch(
      `http://localhost:80/api/skill/remove-skill/${skillId}?type=${type}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!deleteRes.ok) throw new Error("Failed to remove skill");

    // Remove from UI
    const listId =
      type === "teach" ? "edit-teaching-list" : "edit-learning-list";
    const list = document.getElementById(listId);
    const items = list.querySelectorAll(".subject-item");

    items.forEach((item) => {
      if (item.getAttribute("data-skill-id") === skillId.toString()) {
        list.removeChild(item);
      }
    });
  } catch (err) {
    console.error("Error removing subject:", err);
  }
}

//edit info
async function saveProfile() {
  const Users_name = document.getElementById("edit-userName").value.trim();
  const location = document.getElementById("edit-location").value.trim();
  const bio = document.getElementById("edit-about").value.trim();
  const discord = document.getElementById("edit-discord").value.trim();
  const telegram = document.getElementById("edit-telegram").value.trim();
  const email = document.getElementById("edit-gmail").value.trim();

  const token = localStorage.getItem("token");
  if (!token) {
    alert("You are not logged in.");
    return;
  }

  try {
    const res = await fetch("http://localhost:80/api/user/update-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        Users_name,
        location,
        bio,
        telegram,
        discord,
        email,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to update profile.");
    }

    alert(data.message);
    closeModal(); // optional: hide modal or reload info
  } catch (err) {
    console.error("Error updating profile:", err);
    alert("Update failed: " + err.message);
  }
}

function createSubjectItem(subjectObj, type) {
  const { name, id } = subjectObj;
  const item = document.createElement("div");
  item.className = "subject-item";
  item.setAttribute("data-skill-id", id);
  item.setAttribute("data-skill-name", name);
  item.innerHTML = `
    ${name}
    <button class="remove-btn" onclick="removeSubjectFromModal(${id}, '${type}')">&times;</button>
  `;
  return item;
}

function openModal() {
  document.getElementById("edit-profile-modal").classList.remove("hidden");

  // Get current displayed values
  const username = document
    .getElementById("userName")
    .textContent.replace("User name:", "")
    .trim();
  const location = document.getElementById("userLocation").textContent.trim();
  const about = document.getElementById("userAbout").textContent.trim();

  // Fill modal inputs
  document.getElementById("edit-userName").value = username || "";
  document.getElementById("edit-location").value = location || "";
  document.getElementById("edit-about").value = about || "";
  async function loadUserContacts() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:80/api/user/contacts", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to fetch user contacts");

      const contacts = await res.json();
      // Example: fill modal inputs
      document.getElementById("edit-discord").value = contacts.discord;
      document.getElementById("edit-telegram").value = contacts.telegram;
      document.getElementById("edit-gmail").value = contacts.email;
    } catch (err) {
      console.error(err);
    }
  }
  loadUserContacts();

  // update info
  async function saveProfile() {
    const Users_name = document.getElementById("edit-userName").value.trim();
    const location = document.getElementById("edit-location").value.trim();
    const bio = document.getElementById("edit-about").value.trim();
    const discord = document.getElementById("edit-discord").value.trim();
    const telegram = document.getElementById("edit-telegram").value.trim();
    const email = document.getElementById("edit-gmail").value.trim();

    const token = localStorage.getItem("token");
    if (!token) {
      alert("You are not logged in.");
      return;
    }

    try {
      const res = await fetch("http://localhost:80/api/user/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          Users_name,
          location,
          bio,
          telegram,
          discord,
          email,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update profile.");
      }

      alert(data.message);
      closeModal(); // optional: hide modal or reload info
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Update failed: " + err.message);
    }
  }

  function renderModalSubjects({ teaching = [], learning = [] }) {
    const teachingList = document.getElementById("edit-teaching-list");
    const learningList = document.getElementById("edit-learning-list");
    teachingList.innerHTML = "";
    learningList.innerHTML = "";

    teaching.forEach((sub) =>
      teachingList.appendChild(createSubjectItem(sub, "teach"))
    );
    learning.forEach((sub) =>
      learningList.appendChild(createSubjectItem(sub, "learn"))
    );
  }

  async function loadUserSkills() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:80/api/skill/skills`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch skills");

      const skills = await res.json(); // { teaching, learning }
      renderModalSubjects(skills);
    } catch (err) {
      console.error("Skill load failed:", err);
    }
  }

  // Call on page load
  loadUserSkills();

  document
    .getElementById("new-teaching-subject")
    .addEventListener("keydown", handleSubjectInput);
  document
    .getElementById("new-learning-subject")
    .addEventListener("keydown", handleSubjectInput);
}


// Close modal when clicking outside
        document.getElementById('edit-profile-modal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });