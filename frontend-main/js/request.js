function setActiveTab(button, tabType) {
  // تبديل الزر النشط
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach((tab) => tab.classList.remove("active"));
  button.classList.add("active");

  // إظهار القسم المناسب
  document.getElementById("sentRequests").classList.remove("active");
  document.getElementById("receivedRequests").classList.remove("active");

  if (tabType === "sent") {
    document.getElementById("sentRequests").classList.add("active");
  } else {
    document.getElementById("receivedRequests").classList.add("active");
  }
}

window.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".profil, .requests").forEach((el) => {
    el.classList.add("animate-on-load");
  });
});

async function fetchRequests() {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch("http://localhost/api/request/get-request", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Failed to fetch requests");

    const requests = await response.json();
    renderRequests(requests);
  } catch (error) {
    console.error("Error:", error);
  }
}

function timeSince(dateString) {
  const now = new Date();
  const past = new Date(dateString);
  const seconds = Math.floor((now - past) / 1000);

  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1)
    return interval + " year" + (interval > 1 ? "s" : "") + " ago";

  interval = Math.floor(seconds / 2592000);
  if (interval >= 1)
    return interval + " month" + (interval > 1 ? "s" : "") + " ago";

  interval = Math.floor(seconds / 86400);
  if (interval >= 1)
    return interval + " day" + (interval > 1 ? "s" : "") + " ago";

  interval = Math.floor(seconds / 3600);
  if (interval >= 1)
    return interval + " hour" + (interval > 1 ? "s" : "") + " ago";

  interval = Math.floor(seconds / 60);
  if (interval >= 1)
    return interval + " minute" + (interval > 1 ? "s" : "") + " ago";

  return "Just now";
}

function renderRequests(requests) {
  const sentContainer = document.getElementById("sentRequests");
  const receivedContainer = document.getElementById("receivedRequests");

  // Clear existing requests except the title
  sentContainer.querySelectorAll(".profil").forEach((e) => e.remove());
  receivedContainer.querySelectorAll(".profil").forEach((e) => e.remove());

  requests.forEach((req) => {
    // If received request and status is NOT pending, skip rendering it
    if (req.role !== "sender" && req.status.toLowerCase() !== "pending") {
      return; // skip this iteration, no div created
    }

    const profilDiv = document.createElement("div");
    profilDiv.className = "profil";

    const img = document.createElement("img");
    img.src = req.other_user_photo || "image/profil.jpg";
    img.className = "user-img";

    const leftDiv = document.createElement("div");
    leftDiv.className = "left";

    const profileHeader = document.createElement("div");
    profileHeader.className = "profile-header";

    const profileInfo = document.createElement("div");
    profileInfo.className = "profile-info";

    // 1. Skill for this request
    const skillTitle = document.createElement("h3");
    skillTitle.textContent = req.skill?.skills_name || "Unknown Skill";
    profileInfo.appendChild(skillTitle);

    // 2. Other user's name
    const userNameDiv = document.createElement("div");
    userNameDiv.textContent = req.other_user_name || "Unknown User";
    profileInfo.appendChild(userNameDiv);

    // 3. Other user skills
    const userSkillsDiv = document.createElement("div");
    userSkillsDiv.className = "user-skills";

    if (req.other_user_skills && req.other_user_skills.length > 0) {
      req.other_user_skills.forEach((skill) => {
        const skillDiv = document.createElement("div");
        skillDiv.className = "skill-badge";
        skillDiv.textContent = skill.skills_name;
        userSkillsDiv.appendChild(skillDiv);
      });
    } else {
      userSkillsDiv.textContent = "No skills listed";
    }

    profileInfo.appendChild(userSkillsDiv);

    // Duration, Status, Time Ago row
    const requestMetaDiv = document.createElement("div");
    requestMetaDiv.className = "request-meta";

    const durationSpan = document.createElement("span");
    durationSpan.textContent = `Duration: ${req.duration || "N/A"} hours`;
    requestMetaDiv.appendChild(durationSpan);

    requestMetaDiv.appendChild(document.createTextNode(" | "));

    const statusSpan = document.createElement("span");
    const dot = document.createElement("span");
    dot.className = "gold-dot";
    statusSpan.appendChild(dot);
    statusSpan.append(` ${req.status}`);
    requestMetaDiv.appendChild(statusSpan);

    requestMetaDiv.appendChild(document.createTextNode(" | "));

    const timeAgoSpan = document.createElement("span");
    timeAgoSpan.textContent = timeSince(req.created_at);
    requestMetaDiv.appendChild(timeAgoSpan);

    profileInfo.appendChild(requestMetaDiv);

    profileHeader.appendChild(profileInfo);

    if (req.role === "sender") {
      // Sent request: show cancel button if pending
      if (req.status.toLowerCase() === "pending") {
        const cancelBtn = document.createElement("button");
        cancelBtn.className = "cancel-btn";
        cancelBtn.textContent = "Cancel Request";
        cancelBtn.onclick = () => cancelRequest(req.request_id);
        profileHeader.appendChild(cancelBtn);
      }
      leftDiv.appendChild(profileHeader);
      profilDiv.appendChild(img);
      profilDiv.appendChild(leftDiv);
      sentContainer.appendChild(profilDiv);
    } else {
      // Received request: show Accept/Reject buttons (only pending requests reach here)
      const btnDiv = document.createElement("div");
      btnDiv.className = "cont";

      const rejectBtn = document.createElement("button");
      rejectBtn.className = "btn-reject";
      rejectBtn.textContent = "Reject";
      rejectBtn.onclick = () => respondToRequest(req.request_id, "rejected");

      const acceptBtn = document.createElement("button");
      acceptBtn.className = "btn-accept";
      acceptBtn.textContent = "Accept";
      acceptBtn.onclick = () => respondToRequest(req.request_id, "accepted");

      btnDiv.appendChild(rejectBtn);
      btnDiv.appendChild(acceptBtn);
      profileHeader.appendChild(btnDiv);

      leftDiv.appendChild(profileHeader);
      profilDiv.appendChild(img);
      profilDiv.appendChild(leftDiv);
      receivedContainer.appendChild(profilDiv);
    }
  });
}

async function cancelRequest(requestId) {
  try {
    const token = localStorage.getItem("token"); // or sessionStorage

    const res = await fetch(
      `http://localhost:80/api/request/cancel-request/${requestId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (res.ok) {
      alert("Request cancelled");
      fetchRequests(); // Refresh list
    } else {
      alert("Failed to cancel request");
    }
  } catch (err) {
    console.error(err);
    alert("Error cancelling request");
  }
}
async function respondToRequest(requestId, status) {
  try {
    const token = localStorage.getItem("token");
    let url;

    if (status === "accepted") {
      url = `http://localhost:80/api/request/accept-request/${requestId}`;
    } else if (status === "rejected") {
      url = `http://localhost:80/api/request/reject-request/${requestId}`;
    } else {
      alert("Invalid status");
      return;
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (res.ok) {
      alert(`Request ${status}`);
      fetchRequests(); // Refresh the list after updating
    } else {
      alert("Failed to update request");
    }
  } catch (err) {
    console.error(err);
    alert("Error updating request");
  }
}

window.addEventListener("DOMContentLoaded", () => {
  fetchRequests();
});