// Global variables for timer management
let sessionData = null;
let currentUserId = null;
let timerInterval = null;
let pollingInterval = null;
let localElapsedTime = 0;
let localStartTime = null;
let isPaused = false;
let isActive = false;

// DOM Elements
let timerText, pointsText, user1Button, user2Button, user1ReadyIndicator, user2ReadyIndicator;

// Initialize DOM elements
function initializeDOMElements() {
  timerText = document.querySelector(".timer-text");
  pointsText = document.querySelector(".points-text");
  user1Button = document.getElementById("user1-button");
  user2Button = document.getElementById("user2-button");
  user1ReadyIndicator = document.getElementById("user1-ready");
  user2ReadyIndicator = document.getElementById("user2-ready");
}

// Format time display as mm:ss
function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}

// Update timer display with current elapsed time and points
function updateTimerDisplay(elapsedSeconds = null, points = null) {
  if (elapsedSeconds === null) {
    elapsedSeconds = getCurrentElapsedTime();
  }
  if (points === null) {
    points = Math.floor(elapsedSeconds / 2);
  }
  
  if (timerText) {
    timerText.textContent = formatTime(elapsedSeconds);
  }
  if (pointsText) {
    pointsText.textContent = `${points} points earned`;
  }
  
  console.log(`⏱️ Timer Update: ${formatTime(elapsedSeconds)} - ${points} points`);
}

// Get current elapsed time based on session state
function getCurrentElapsedTime() {
  if (!isActive) {
    return localElapsedTime;
  }
  
  if (isPaused) {
    return localElapsedTime;
  }
  
  if (localStartTime) {
    const now = new Date();
    const currentSessionTime = Math.floor((now - localStartTime) / 1000);
    return localElapsedTime + currentSessionTime;
  }
  
  return localElapsedTime;
}

// Start the timer interval
function startTimerInterval() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  console.log("🚀 Starting timer interval");
  
  timerInterval = setInterval(() => {
    if (isActive && !isPaused) {
      const currentElapsed = getCurrentElapsedTime();
      const points = Math.floor(currentElapsed / 2);
      updateTimerDisplay(currentElapsed, points);
    }
  }, 1000);
}

// Stop the timer interval
function stopTimerInterval() {
  if (timerInterval) {
    console.log("⏹️ Stopping timer interval");
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// Handle session state changes
function handleSessionStateChange(classInfo) {
  const wasActive = isActive;
  const wasPaused = isPaused;
  
  isActive = classInfo.is_active || classInfo.isActive;
  isPaused = classInfo.is_paused || classInfo.isPaused;
  
  console.log(`📊 Session State: Active=${isActive}, Paused=${isPaused}, ElapsedTime=${classInfo.elapsedTime}`);
  
  // Update elapsed time from server
  if (classInfo.elapsedTime !== undefined) {
    localElapsedTime = classInfo.elapsedTime;
  }
  
  // Handle state transitions
  if (isActive && !isPaused) {
    // Session is running
    if (classInfo.start_time || classInfo.startTime) {
      localStartTime = new Date(classInfo.start_time || classInfo.startTime);
    }
    
    if (!wasActive || wasPaused) {
      console.log("▶️ Session started/resumed");
      startTimerInterval();
      updateSessionButtons('running');
      showToast("Session is running!", "success");
    }
  } else if (isActive && isPaused) {
    // Session is paused
    if (wasActive && !wasPaused) {
      console.log("⏸️ Session paused");
      stopTimerInterval();
      updateSessionButtons('paused');
      showToast("Session paused", "info");
    }
    updateTimerDisplay();
  } else if (!isActive) {
    // Session ended or not started
    if (wasActive) {
      console.log("⏹️ Session ended");
      stopTimerInterval();
      updateSessionButtons('ended');
      showToast(`Session ended! ${Math.floor(localElapsedTime / 2)} points earned.`, "success");
    }
    updateTimerDisplay();
  }
}

// Load class session data
async function loadClassSession() {
  try {
    const classId = localStorage.getItem("currentClassId");
    const token = localStorage.getItem("token");

    if (!classId) {
      console.error("No class ID found in localStorage");
      showToast('Missing class ID. Set localStorage.setItem("currentClassId", "YOUR_CLASS_ID")', "error");
      return;
    }

    if (!token) {
      console.error("No token found in localStorage");
      showToast("You must log in first to get the token", "error");
      return;
    }

    const response = await fetch(`http://localhost:80/api/class/${classId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to load class session: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Class session loaded:", data);

    // Store session data globally
    sessionData = data;
    currentUserId = data.currentUser.id;

    // Update UI elements
    if (document.querySelector(".card-title")) {
      document.querySelector(".card-title").textContent = data.classInfo.skillName || "Class Session";
    }

    // Update user profiles
    updateUserProfiles(data);
    
    // Handle session state
    handleSessionStateChange(data.classInfo);
    
    // Setup user buttons
    setupUserButtons(data);
    
    // Update ready status
    updateReadyStatus(data.classInfo);

  } catch (error) {
    console.error("[loadClassSession Error]", error);
    showToast("Failed to load class session. See console for details.", "error");
  }
}

// Toggle ready status
async function toggleReadyStatus() {
  const classId = localStorage.getItem("currentClassId");
  const token = localStorage.getItem("token");
  
  try {
    const response = await fetch(`http://localhost:80/api/class/${classId}/ready`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log("Ready status result:", result);
      showToast(result.message, "success");
      
      // Handle automatic session start/resume
      if (result.sessionStarted) {
        handleSessionStateChange({
          is_active: true,
          is_paused: false,
          start_time: result.startTime,
          elapsedTime: 0
        });
      } else if (result.sessionResumed) {
        handleSessionStateChange({
          is_active: true,
          is_paused: false,
          start_time: new Date(),
          elapsedTime: localElapsedTime
        });
      }
      
      // Update ready indicators
      updateReadyIndicators(result.teacherReady, result.studentReady);
      
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to toggle ready status");
    }
  } catch (error) {
    console.error("Toggle ready failed:", error);
    showToast(error.message || "Failed to update ready status", "error");
  }
}

// Pause session
async function pauseSession() {
  const classId = localStorage.getItem("currentClassId");
  const token = localStorage.getItem("token");
  
  try {
    const response = await fetch(`http://localhost:80/api/class/${classId}/pause`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log("Pause result:", result);
      
      // Update local state
      localElapsedTime = result.elapsedTime;
      handleSessionStateChange({
        is_active: true,
        is_paused: true,
        elapsedTime: result.elapsedTime
      });
      
      showToast(result.message, "success");
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to pause session");
    }
  } catch (error) {
    console.error("Pause failed:", error);
    showToast(error.message || "Failed to pause session", "error");
  }
}

// End session
async function endSession() {
  const classId = localStorage.getItem("currentClassId");
  const token = localStorage.getItem("token");
  
  try {
    const response = await fetch(`http://localhost:80/api/class/${classId}/end`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        reason: "Manual end"
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log("End session result:", result);
      
      // Update local state
      localElapsedTime = result.elapsedTime;
      handleSessionStateChange({
        is_active: false,
        is_paused: false,
        elapsedTime: result.elapsedTime
      });
      
      showToast(`Session ended! ${result.pointsEarned} points earned.`, "success");
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to end session");
    }
  } catch (error) {
    console.error("End session failed:", error);
    showToast(error.message || "Failed to end session", "error");
  }
}

// Update user profiles
function updateUserProfiles(data) {
  const { currentUser, otherUser, userRole } = data;

  if (userRole === "teacher") {
    updateUserProfile(".user-left", currentUser, "Teacher");
    updateUserProfile(".user-right", otherUser, "Learner");
  } else {
    updateUserProfile(".user-left", otherUser, "Teacher");
    updateUserProfile(".user-right", currentUser, "Learner");
  }
}

// Helper function to update a user profile section
function updateUserProfile(selector, user, role) {
  const userElement = document.querySelector(selector);
  if (userElement) {
    const nameElement = userElement.querySelector(".user-name");
    const imageElement = userElement.querySelector(".profile-image img");
    const roleElement = userElement.querySelector(".role");
    
    if (nameElement) nameElement.textContent = user.username;
    if (imageElement && user.profilePicture) imageElement.src = user.profilePicture;
    if (roleElement) roleElement.textContent = role;
  }
}

// Setup user buttons
function setupUserButtons(data) {
  const { currentUser, userRole } = data;
  
  if (!user1Button || !user2Button) return;
  
  // Determine which button belongs to current user
  let currentUserButton, otherUserButton;
  let currentUserButtonId, otherUserButtonId;
  
  if (userRole === "teacher") {
    currentUserButton = user1Button;
    otherUserButton = user2Button;
    currentUserButtonId = "user1-button";
    otherUserButtonId = "user2-button";
  } else {
    // For student, check which side they're on
    const leftName = document.querySelector(".user-left .user-name")?.textContent;
    if (leftName === currentUser.username) {
      currentUserButton = user1Button;
      otherUserButton = user2Button;
      currentUserButtonId = "user1-button";
      otherUserButtonId = "user2-button";
    } else {
      currentUserButton = user2Button;
      otherUserButton = user1Button;
      currentUserButtonId = "user2-button";
      otherUserButtonId = "user1-button";
    }
  }
  
  // Enable only current user's button
  currentUserButton.disabled = false;
  currentUserButton.style.opacity = "1";
  currentUserButton.style.cursor = "pointer";
  
  // Disable other user's button
  otherUserButton.disabled = true;
  otherUserButton.style.opacity = "0.5";
  otherUserButton.style.cursor = "not-allowed";
  
  // Remove old event listeners by cloning and replacing
  const newCurrentUserButton = currentUserButton.cloneNode(true);
  currentUserButton.parentNode.replaceChild(newCurrentUserButton, currentUserButton);
  
  // Get the new button reference
  currentUserButton = document.getElementById(currentUserButtonId);
  
  // Add event listener to current user button
  if (currentUserButton) {
    currentUserButton.addEventListener("click", function() {
      handleUserAction();
    });
  }
  
  // Show message on disabled button click
  if (otherUserButton) {
    otherUserButton.addEventListener("click", function(e) {
      e.preventDefault();
      showToast("You can only control your own actions", "info");
    });
  }
}

// Handle user actions based on current session state
async function handleUserAction() {
  try {
    if (!isActive) {
      // Session not started - toggle ready
      await toggleReadyStatus();
    } else if (isActive && !isPaused) {
      // Session running - pause it
      await pauseSession();
    } else if (isActive && isPaused) {
      // Session paused - toggle ready to resume
      await toggleReadyStatus();
    }
  } catch (error) {
    console.error("Action failed:", error);
    showToast("Action failed. Please try again.", "error");
  }
}

// Update session buttons based on state
function updateSessionButtons(state) {
  if (!sessionData) return;
  
  const { userRole } = sessionData;
  let currentUserButton, currentUserButtonId;
  
  if (userRole === "teacher") {
    currentUserButtonId = "user1-button";
  } else {
    const leftName = document.querySelector(".user-left .user-name")?.textContent;
    currentUserButtonId = (leftName === sessionData.currentUser.username) ? "user1-button" : "user2-button";
  }
  
  currentUserButton = document.getElementById(currentUserButtonId);
  const endButton = document.getElementById("end-button");
  
  if (!currentUserButton) return;
  
  // Remove all button classes
  currentUserButton.classList.remove("purple-button", "blue-button", "red-button", "green-button", "gray-button");
  
  switch (state) {
    case 'ready':
      currentUserButton.textContent = isPaused ? "Ready to Resume" : "Ready to Start";
      currentUserButton.disabled = false;
      currentUserButton.classList.add(userRole === "teacher" ? "purple-button" : "blue-button");
      // Hide end button when not active
      if (endButton) endButton.style.display = "none";
      break;
    case 'running':
      currentUserButton.textContent = "Pause Session";
      currentUserButton.disabled = false;
      currentUserButton.classList.add("red-button");
      // Show end button when session is running
      if (endButton) {
        endButton.style.display = "inline-flex";
        // Add event listener if not already added
        if (!endButton.hasAttribute('data-listener-added')) {
          endButton.addEventListener('click', endSession);
          endButton.setAttribute('data-listener-added', 'true');
        }
      }
      break;
    case 'paused':
      currentUserButton.textContent = "Ready to Resume";
      currentUserButton.disabled = false;
      currentUserButton.classList.add("green-button");
      // Show end button when session is paused
      if (endButton) {
        endButton.style.display = "inline-flex";
        // Add event listener if not already added
        if (!endButton.hasAttribute('data-listener-added')) {
          endButton.addEventListener('click', endSession);
          endButton.setAttribute('data-listener-added', 'true');
        }
      }
      break;
    case 'ended':
      currentUserButton.textContent = "Session Ended";
      currentUserButton.disabled = true;
      currentUserButton.classList.add("gray-button");
      // Hide end button when session is ended
      if (endButton) endButton.style.display = "none";
      break;
  }
}
// Update ready status indicators
function updateReadyStatus(classInfo) {
  updateReadyIndicators(classInfo.is_teacher_ready, classInfo.is_student_ready);
}

// Update ready indicators
function updateReadyIndicators(teacherReady, studentReady) {
  if (!user1ReadyIndicator || !user2ReadyIndicator || !sessionData) return;
  
  const { userRole } = sessionData;
  
  if (userRole === "teacher") {
    // Teacher is user1, student is user2
    user1ReadyIndicator.textContent = teacherReady ? "Ready!" : "Not Ready";
    user1ReadyIndicator.style.color = teacherReady ? "#10b981" : "#ef4444";
    user2ReadyIndicator.textContent = studentReady ? "Ready!" : "Not Ready";
    user2ReadyIndicator.style.color = studentReady ? "#10b981" : "#ef4444";
  } else {
    // Determine which indicator belongs to which role based on layout
    const leftName = document.querySelector(".user-left .user-name")?.textContent;
    const currentUserName = sessionData.currentUser.username;
    
    if (leftName === currentUserName) {
      // Current user (student) is on left
      user1ReadyIndicator.textContent = studentReady ? "Ready!" : "Not Ready";
      user1ReadyIndicator.style.color = studentReady ? "#10b981" : "#ef4444";
      user2ReadyIndicator.textContent = teacherReady ? "Ready!" : "Not Ready";
      user2ReadyIndicator.style.color = teacherReady ? "#10b981" : "#ef4444";
    } else {
      // Current user (student) is on right
      user1ReadyIndicator.textContent = teacherReady ? "Ready!" : "Not Ready";
      user1ReadyIndicator.style.color = teacherReady ? "#10b981" : "#ef4444";
      user2ReadyIndicator.textContent = studentReady ? "Ready!" : "Not Ready";
      user2ReadyIndicator.style.color = studentReady ? "#10b981" : "#ef4444";
    }
  }
}

// Start polling for session updates
function startSessionPolling() {
  // Poll every 2 seconds for session updates
  setInterval(async () => {
    try {
      const classId = localStorage.getItem("currentClassId");
      const token = localStorage.getItem("token");
      
      if (!classId || !token) return;
      
      const response = await fetch(`http://localhost:80/api/class/${classId}/status`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const statusData = await response.json();
        
        // Update ready status
        updateReadyIndicators(statusData.isTeacherReady, statusData.isStudentReady);
        
        // Check for session state changes
        const newState = {
          is_active: statusData.isActive,
          is_paused: statusData.isPaused,
          start_time: statusData.startTime,
          elapsedTime: statusData.elapsedTime
        };
        
        // Only update if state actually changed
        if (newState.is_active !== isActive || newState.is_paused !== isPaused) {
          handleSessionStateChange(newState);
        } else if (statusData.elapsedTime !== undefined && statusData.elapsedTime !== localElapsedTime) {
          // Update elapsed time if it changed on server
          localElapsedTime = statusData.elapsedTime;
          updateTimerDisplay();
        }
        
      }
    } catch (error) {
      console.error("Polling error:", error);
    }
  }, 2000);
}

// Toast notification function
function showToast(message, type = "info") {
  console.log(`🔔 ${type.toUpperCase()}: ${message}`);
  
  // Create toast element if it doesn't exist
  let toast = document.getElementById('toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 10000;
      transition: all 0.3s ease;
      transform: translateX(100%);
    `;
    document.body.appendChild(toast);
  }
  
  // Set color based on type
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    info: '#3b82f6',
    warning: '#f59e0b'
  };
  
  toast.style.backgroundColor = colors[type] || colors.info;
  toast.textContent = message;
  toast.style.transform = 'translateX(0)';
  
  // Auto hide after 3 seconds
  setTimeout(() => {
    toast.style.transform = 'translateX(100%)';
  }, 3000);
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log("🚀 Initializing timer system...");
  
  // Initialize DOM elements
  initializeDOMElements();
  
  // Load class session
  loadClassSession();
  
  // Start polling for updates
  startSessionPolling();
  
  // Initial timer display
  updateTimerDisplay(0, 0);
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
  stopTimerInterval();
});
// Function to show toast notifications
function showToast(message, type) {
  // Create toast element if it doesn't exist
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    document.body.appendChild(toast);
  }
  
  // Set toast style based on type
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    info: '#3b82f6',
    warning: '#f59e0b'
  };
  
  toast.style.backgroundColor = colors[type] || colors.info;
  toast.textContent = message;
  toast.style.opacity = '1';
  
  // Hide toast after 3 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
  }, 3000);
}



// Cleanup on page unload
window.addEventListener('beforeunload', function() {
  stopTimer();
});





















// behc nerja3 lel previous page
document.getElementById("backButton").addEventListener("click", function () {
  history.back();
});
//te3 files
document.addEventListener("DOMContentLoaded", function () {
  const filesButton = document.getElementById("files-button");
  const filesModal = document.getElementById("filesModal");
  const closeFilesModal = document.getElementById("closeFilesModal");
  const fileInput = document.getElementById("fileInput");
  const uploadButton = document.getElementById("upload-button");
  const fileList = document.getElementById("fileList");

  // Store uploaded files
  let uploadedFiles = [];

  // Create modal overlay
  const modalOverlay = document.createElement("div");
  modalOverlay.className = "modal-overlay";
  document.body.appendChild(modalOverlay);

  // Show files modal
  function showFilesModal() {
    filesModal.style.display = "flex";
    modalOverlay.classList.add("active");
    setTimeout(() => {
      filesModal.classList.add("active");
    }, 10);
    updateFileList();
  }

  // Hide files modal
  function hideFilesModal() {
    filesModal.classList.remove("active");
    modalOverlay.classList.remove("active");
    setTimeout(() => {
      filesModal.style.display = "none";
    }, 300);
  }

  // Get file icon based on file type
  function getFileIcon(fileName) {
    const extension = fileName.split(".").pop().toLowerCase();
    const iconMap = {
      pdf: { icon: "📄", class: "pdf" },
      doc: { icon: "📝", class: "doc" },
      docx: { icon: "📝", class: "doc" },
      txt: { icon: "📄", class: "text" },
      jpg: { icon: "🖼️", class: "image" },
      jpeg: { icon: "🖼️", class: "image" },
      png: { icon: "🖼️", class: "image" },
      gif: { icon: "🖼️", class: "image" },
      mp4: { icon: "🎥", class: "video" },
      mp3: { icon: "🎵", class: "audio" },
      wav: { icon: "🎵", class: "audio" },
      zip: { icon: "📦", class: "archive" },
      rar: { icon: "📦", class: "archive" },
    };

    return iconMap[extension] || { icon: "📄", class: "default" };
  }

  // Format file size
  function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Update file list display
  function updateFileList() {
    if (uploadedFiles.length === 0) {
      fileList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📁</div>
                    <div class="empty-title">No files uploaded</div>
                    <div class="empty-description">Upload files using the "Upload Files" button to see them here.</div>
                </div>
            `;
      return;
    }

    fileList.innerHTML = uploadedFiles
      .map((file, index) => {
        const fileIcon = getFileIcon(file.name);
        const uploadDate = new Date(file.uploadDate).toLocaleDateString();

        return `
                <li class="file-item" data-index="${index}">
                    <div class="file-info">
                        <div class="file-icon ${fileIcon.class}">
                            ${fileIcon.icon}
                        </div>
                        <div class="file-details">
                            <div class="file-name" title="${file.name}">${
          file.name
        }</div>
                            <div class="file-meta">
                                <span>${formatFileSize(file.size)}</span>
                                <span>Uploaded ${uploadDate}</span>
                            </div>
                        </div>
                    </div>
                    <div class="file-actions">
                        <button class="file-action-btn download" title="Download" onclick="downloadFile(${index})">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7,10 12,15 17,10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                        </button>
                        <button class="file-action-btn delete" title="Remove" onclick="removeFile(${index})">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3,6 5,6 21,6"/>
                                <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                            </svg>
                        </button>
                    </div>
                </li>
            `;
      })
      .join("");
  }

  // Add file to uploaded files list
  async function addFiles(files) {
    const classId = localStorage.getItem("currentClassId");
    const uploadUrl = `http://localhost:80/api/class/upload/${classId}`;

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file); // must match backend field name

      try {
        const response = await fetch(uploadUrl, {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const result = await response.json();
        showToast(`${file.name} uploaded successfully!`, "success");
      } catch (err) {
        console.error(err);
        showToast(`Failed to upload ${file.name}`, "error");
      }
    }

    fetchFilesFromBackend(); // reload files from server
  }

  async function fetchFilesFromBackend() {
    const classId = localStorage.getItem("currentClassId");
    const url = `http://localhost:80/api/class/files/${classId}`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch files");

      const filesFromServer = await response.json();
      console.log("Files received:", filesFromServer);
      uploadedFiles = filesFromServer.map((file) => ({
        id: file.id,
        name: file.filename,
        size: file.sizeKB,
        uploadDate: file.uploaded_at,
        filepath: file.filepath
      }));

      updateFileList();
    } catch (err) {
      console.error(err);
      showToast("Failed to load files from server", "error");
    }
  }

  window.addEventListener("load", () => {
    fetchFilesFromBackend();
  });

  // download file
window.downloadFile = function(index) {
  const fileData = uploadedFiles[index];
  const fileUrl = `http://localhost:80/uploads/${fileData.name}`;
  window.open(fileUrl, '_blank');
  showToast(`Downloading ${fileData.name}`, "info");
};


  // Remove file - FIXED VERSION
  window.removeFile = async function (index) {
    const file = uploadedFiles[index];
    const fileId = file.id;

    try {
      const response = await fetch(`http://localhost:80/api/class/file/${fileId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete");

      // Remove from local array and update UI
      uploadedFiles.splice(index, 1);
      updateFileList();
      showToast(`${file.name} removed`, "info");
    } catch (err) {
      console.error(err);
      showToast(`Failed to delete ${file.name}`, "error");
    }
  };

  // Event listeners
  filesButton.addEventListener("click", showFilesModal);
  closeFilesModal.addEventListener("click", hideFilesModal);
  modalOverlay.addEventListener("click", hideFilesModal);

  // Upload button functionality
  uploadButton.addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      addFiles(e.target.files);
      e.target.value = ""; // Reset input
    }
  });

  // Prevent modal from closing when clicking inside it
  filesModal.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // Keyboard support
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && filesModal.classList.contains("active")) {
      hideFilesModal();
    }
  });
});
//load animations
document.addEventListener("DOMContentLoaded", () => {
  const tl = gsap.timeline({
    defaults: {
      duration: 0.6,
      ease: "power3.out",
    },
  });

  // Animate main card first
  tl.from(".big-card", {
    opacity: 0,
    scale: 0.95,
    duration: 0.2,
    ease: "back.out(1.2)",
  })

    // Animate card header
    .from(
      ".card-header",
      {
        opacity: 0,
        y: -20,
        stagger: 0.1,
        ease: "power2.out",
      },
      "-=0.6"
    )

    // Animate timer display
    .from(
      ".timer-display",
      {
        opacity: 0,
        y: -30,
        scale: 0.9,
        duration: 0.7,
        ease: "back.out(1.3)",
      },
      "-=0.5"
    )

    // Animate user profiles from opposite sides
    .from(
      ".user-profile:nth-child(1)",
      {
        opacity: 0,
        x: -80,
        duration: 0.8,
        ease: "power3.out",
      },
      "-=0.4"
    )
    .from(
      ".user-profile:nth-child(2)",
      {
        opacity: 0,
        x: 80,
        duration: 0.8,
        ease: "power3.out",
      },
      "-=0.8"
    )

    // Animate timer controls
    .from(
      ".timer-controls",
      {
        opacity: 0,
        y: 30,
        stagger: 0.1,
        duration: 0.5,
        ease: "back.out(1.5)",
      },
      "-=0.5"
    );
});
// Enhanced feedback submission with API integration and improved styling
document.addEventListener("DOMContentLoaded", function () {
  // Find existing elements
  const windowModal = document.querySelector(".window");
  const feedbackContainer = document.querySelector(".feedback-container");
  const endButton = document.getElementById("end-button");
  const closeButton = document.querySelector(".window .x");
  const cancelButton = document.querySelector(".window .btn:nth-child(1)");
  const confirmEndButton = document.querySelector(".window .btn:nth-child(2)");
  const sessionDurationText = document.querySelector(".session-details .session-item:first-child span:last-child");
  const pointsEarnedText = document.querySelector(".session-details .session-item:last-child span:last-child");
  const reasonCards = document.querySelectorAll(".card");
  const submitButton = document.getElementById("submit");
  const closeFeedbackBtn = document.getElementById("close");
  
  let selectedReason = null;

  // Create overlays if they don't exist
  let overlay = document.querySelector(".overlay:not(.feedback-overlay)");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "overlay";
    document.body.appendChild(overlay);
  }

  let feedbackOverlay = document.querySelector(".feedback-overlay");
  if (!feedbackOverlay) {
    feedbackOverlay = document.createElement("div");
    feedbackOverlay.className = "overlay feedback-overlay";
    document.body.appendChild(feedbackOverlay);
  }

  // Hide containers initially
  if (feedbackContainer) {
    feedbackContainer.style.display = "none";
  }
  if (windowModal) {
    windowModal.style.display = "none";
  }
  overlay.style.display = "none";
  feedbackOverlay.style.display = "none";

  // Utility functions for API integration
  function getClassId() {
    const pathParts = window.location.pathname.split("/");
    const classIndex = pathParts.indexOf("class");
    if (classIndex !== -1 && pathParts[classIndex + 1]) {
      return pathParts[classIndex + 1];
    }

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("classId")) {
      return urlParams.get("classId");
    }

    const classIdAttr =
      document.body.getAttribute("data-class-id") ||
      document.querySelector("[data-class-id]")?.getAttribute("data-class-id");
    if (classIdAttr) {
      return classIdAttr;
    }

    if (typeof window.classId !== "undefined") {
      return window.classId;
    }

    console.error("Class ID not found. Please ensure the class ID is available.");
    return null;
  }

  function getAuthToken() {
    const tokenFromStorage =
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("jwt");

    if (tokenFromStorage) {
      return tokenFromStorage;
    }
  }

  // Format session duration helper function
  function formatSessionDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }

  function getSecondsFromTimer(text) {
    if (!text) return 0;
    const parts = text.split(":").map(Number);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return 0;
  }

  // Modal window functions
  function showWindowModal() {
    const timerText = document.querySelector(".timer-text");
    const sessionDurationDisplay = document.querySelector(".window p:nth-of-type(3)");
    
    if (timerText && sessionDurationDisplay) {
      const seconds = getSecondsFromTimer(timerText.textContent);
      sessionDurationDisplay.textContent = `Session duration: ${formatSessionDuration(seconds)}`;
    }
    
    overlay.style.display = "block";
    windowModal.style.display = "flex";
    
    if (typeof gsap !== "undefined") {
      gsap.fromTo(
        windowModal,
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, ease: "power2.out" }
      );
    }
  }

  function hideWindowModal() {
    if (typeof gsap !== "undefined") {
      gsap.to(windowModal, {
        scale: 0.8,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          windowModal.style.display = "none";
          overlay.style.display = "none";
        },
      });
    } else {
      windowModal.style.display = "none";
      overlay.style.display = "none";
    }
  }

  // Function to show feedback container
  function showFeedbackContainer() {
    if (feedbackContainer) {
      // Update session details
      const timerText = document.querySelector(".timer-text")?.textContent || "00:00";
      const pointsText = document.querySelector(".points-text")?.textContent?.split(" ")[0] || "0";

      // Update the feedback container with current values
      if (sessionDurationText) sessionDurationText.textContent = timerText;
      if (pointsEarnedText) pointsEarnedText.textContent = pointsText;

      // Show the feedback container and overlay
      feedbackContainer.style.display = "block";
      feedbackOverlay.style.display = "block";

      // Add animation if GSAP is available
      if (typeof gsap !== "undefined") {
        gsap.fromTo(
          feedbackContainer,
          { y: -30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" }
        );
      }
    }
  }

  // Function to hide feedback container
  function hideFeedbackContainer() {
    if (feedbackContainer) {
      if (typeof gsap !== "undefined") {
        gsap.to(feedbackContainer, {
          y: -30,
          opacity: 0,
          duration: 0.3,
          ease: "power2.in",
          onComplete: () => {
            feedbackContainer.style.display = "none";
            feedbackOverlay.style.display = "none";
          },
        });
      } else {
        feedbackContainer.style.display = "none";
        feedbackOverlay.style.display = "none";
      }
    }
  }

  // Card selection functionality
  function resetCardSelection() {
    reasonCards.forEach(card => {
      card.classList.remove('selected');
      card.removeAttribute("data-selected");
      
      if (typeof gsap !== 'undefined') {
        gsap.set(card, {
          backgroundColor: 'transparent',
          color: '',
          y: 0,
          scale: 1
        });
      } else {
        card.style.backgroundColor = '';
        card.style.color = '';
        card.style.transform = '';
        card.style.transition = '';
      }
    });
    selectedReason = null;
  }

  function handleCardSelection(selectedCard) {
    resetCardSelection();
    
    selectedCard.classList.add('selected');
    selectedCard.setAttribute("data-selected", "true");
    selectedReason = selectedCard.dataset.value;
    
    if (typeof gsap !== 'undefined') {
      gsap.set(selectedCard, {
        backgroundColor: 'var(--primary)',
        color: 'white',
        y: 0,
        scale: 1
      });
    } else {
      selectedCard.style.backgroundColor = 'var(--primary)';
      selectedCard.style.color = 'white';
      selectedCard.style.transform = '';
      selectedCard.style.transition = '';
    }
  }

  // Initialize card events
  reasonCards.forEach((card) => {
    card.addEventListener("click", () => handleCardSelection(card));
    
    // Hover effects (works with or without GSAP)
    card.addEventListener('mouseenter', () => {
      if (!card.classList.contains('selected')) {
        if (typeof gsap !== 'undefined') {
          gsap.to(card, {
            y: -3,
            scale: 1.02,
            duration: 0.2,
            ease: 'power1.out'
          });
        } else {
          card.style.transform = 'translateY(-3px) scale(1.02)';
          card.style.transition = 'transform 0.2s ease-out';
        }
      }
    });
    
    card.addEventListener('mouseleave', () => {
      if (!card.classList.contains('selected')) {
        if (typeof gsap !== 'undefined') {
          gsap.to(card, {
            y: 0,
            scale: 1,
            duration: 0.2,
            ease: 'power1.in'
          });
        } else {
          card.style.transform = 'translateY(0) scale(1)';
          card.style.transition = 'transform 0.2s ease-in';
        }
      }
    });
  });

  // Event listeners for modal controls
  if (endButton) {
    endButton.addEventListener("click", function(event) {
      event.preventDefault();
      showWindowModal();
    });
  }

  if (closeButton) {
    closeButton.addEventListener("click", function(event) {
      event.preventDefault();
      hideWindowModal();
    });
  }

  if (cancelButton) {
    cancelButton.addEventListener("click", function(event) {
      event.preventDefault();
      hideWindowModal();
    });
  }

  // Overlay click to close modal
  overlay.addEventListener("click", function(event) {
    if (event.target === overlay) {
      hideWindowModal();
    }
  });

  // Confirm end button - show feedback after ending session
  if (confirmEndButton) {
    confirmEndButton.addEventListener("click", function (event) {
      event.preventDefault();

      // Store the selected reason before hiding modal
      const selectedCard = document.querySelector('.card.selected');
      if (selectedCard) {
        selectedCard.setAttribute("data-selected", "true");
      }

      // Hide the end session modal first
      hideWindowModal();

      // Then show feedback
      setTimeout(() => {
        showFeedbackContainer();
        loadFeedbackDraft(); // Load any saved draft
      }, 100);

      // End the timer in background
      if (typeof endTimer === "function") {
        const currentUser = typeof users !== "undefined" ? users.user1 : null;
        endTimer(currentUser);
      }
    });
  }

  // API Configuration
  const API_CONFIG = {
    baseUrl: window.location.origin,
    getHeaders: function () {
      const token = getAuthToken();
      const headers = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      return headers;
    },
  };

  // Function to get feedback data
  function getFeedbackData() {
    const selectedStars = document.querySelectorAll(".star.selected");
    const finalRating = selectedStars.length;

    const commentTextarea = document.querySelector(".feedback-container textarea");
    const comment = commentTextarea ? commentTextarea.value.trim() : "";

    const selectedReasonCard = document.querySelector('.card[data-selected="true"]');
    const endReason = selectedReasonCard ? selectedReasonCard.dataset.value : null;

    return {
      rating: finalRating,
      comment: comment,
      endReason: endReason,
    };
  }

  // Function to validate feedback data
  function validateFeedbackData(data) {
    const errors = [];

    if (!data.rating || data.rating < 1 || data.rating > 5) {
      errors.push("Please provide a rating between 1 and 5 stars");
    }

    if (!data.comment || data.comment.length < 3) {
      errors.push("Please provide a comment with at least 3 characters");
    }

    if (data.comment && data.comment.length > 500) {
      errors.push("Comment must be less than 500 characters");
    }

    return errors;
  }

  // Function to submit feedback to API
  async function submitFeedbackToAPI(feedbackData) {
    const classId = getClassId();

    if (!classId) {
      throw new Error("Class ID not found");
    }

    try {
      // Show loading state
      if (submitButton) {
        submitButton.textContent = "Submitting...";
        submitButton.disabled = true;
      }

      // Prepare data for backend (only rating and comment)
      const backendData = {
        rating: feedbackData.rating,
        comment: feedbackData.comment,
      };

      const response = await fetch(
        `http://localhost:80/api/class/feedback/${classId}`,
        {
          method: "POST",
          headers: API_CONFIG.getHeaders(),
          body: JSON.stringify(backendData),
        }
      );

      // Reset button state
      if (submitButton) {
        submitButton.textContent = "Submit Feedback";
        submitButton.disabled = false;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();

      // Show success message
      showToast("Feedback submitted successfully!", "success");

      // Hide feedback container
      hideFeedbackContainer();

      // Clear form
      clearFeedbackForm();

      return result;
    } catch (error) {
      console.error("Error submitting feedback:", error);

      // Reset button state
      if (submitButton) {
        submitButton.textContent = "Submit Feedback";
        submitButton.disabled = false;
      }

      // Show error message
      showToast(
        error.message || "Failed to submit feedback. Please try again.",
        "error"
      );

      throw error;
    }
  }

  // Function to clear feedback form
  function clearFeedbackForm() {
    // Clear star rating
    const stars = document.querySelectorAll(".star");
    stars.forEach((star) => {
      star.classList.remove("selected");
      const icon = star.querySelector("i");
      if (icon) {
        icon.classList.remove("fa-solid");
        icon.classList.add("fa-regular");
      }
    });

    // Clear comment
    const commentTextarea = document.querySelector(".feedback-container textarea");
    if (commentTextarea) commentTextarea.value = "";

    // Clear selected reason card
    resetCardSelection();
  }

  // Submit button event listener
  if (submitButton) {
    submitButton.addEventListener("click", async function (event) {
      event.preventDefault();

      try {
        // Get feedback data
        const feedbackData = getFeedbackData();

        // Validate data
        const validationErrors = validateFeedbackData(feedbackData);
        if (validationErrors.length > 0) {
          showToast(validationErrors[0], "error");
          return;
        }

        // Submit to API
        await submitFeedbackToAPI(feedbackData);
      } catch (error) {
        console.error("Feedback submission failed:", error);
        // Error handling is already done in submitFeedbackToAPI
      }
    });
  }

  // Close feedback button functionality
  if (closeFeedbackBtn) {
    closeFeedbackBtn.addEventListener("click", function (event) {
      event.preventDefault();
      hideFeedbackContainer();
    });
  }

  // Star rating functionality
  function initializeStarRating() {
    const stars = document.querySelectorAll(".star");

    stars.forEach((star, index) => {
      star.addEventListener("click", function () {
        // Clear all stars
        stars.forEach((s) => {
          s.classList.remove("selected");
          const icon = s.querySelector("i");
          if (icon) {
            icon.classList.remove("fa-solid");
            icon.classList.add("fa-regular");
          }
        });

        // Fill stars up to clicked one
        for (let i = 0; i <= index; i++) {
          stars[i].classList.add("selected");
          const icon = stars[i].querySelector("i");
          if (icon) {
            icon.classList.remove("fa-regular");
            icon.classList.add("fa-solid");
          }
        }
      });
    });
  }

  // Initialize star rating
  initializeStarRating();

  // Draft functionality
  function saveFeedbackDraft() {
    const feedbackData = getFeedbackData();
    const classId = getClassId();

    if (classId) {
      localStorage.setItem(
        `feedbackDraft_${classId}`,
        JSON.stringify({
          rating: feedbackData.rating,
          comment: feedbackData.comment,
          timestamp: Date.now(),
        })
      );
    }
  }

  function loadFeedbackDraft() {
    const classId = getClassId();
    if (!classId) return;

    const draft = localStorage.getItem(`feedbackDraft_${classId}`);
    if (draft) {
      try {
        const data = JSON.parse(draft);
        // Check if draft is less than 24 hours old
        if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
          // Restore rating - stars
          if (data.rating && data.rating > 0) {
            const stars = document.querySelectorAll(".star");
            for (let i = 0; i < Math.min(data.rating, stars.length); i++) {
              stars[i].classList.add("selected");
              const icon = stars[i].querySelector("i");
              if (icon) {
                icon.classList.remove("fa-regular");
                icon.classList.add("fa-solid");
              }
            }
          }

          // Restore comment
          const commentTextarea = document.querySelector(".feedback-container textarea");
          if (commentTextarea && data.comment) {
            commentTextarea.value = data.comment;
          }
        } else {
          // Remove old draft
          localStorage.removeItem(`feedbackDraft_${classId}`);
        }
      } catch (error) {
        console.error("Error loading feedback draft:", error);
        localStorage.removeItem(`feedbackDraft_${classId}`);
      }
    }
  }

  // Auto-save draft while typing
  const commentTextarea = document.querySelector(".feedback-container textarea");
  if (commentTextarea) {
    let saveTimeout;
    commentTextarea.addEventListener("input", function () {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(saveFeedbackDraft, 1000); // Save after 1 second of no typing
    });
  }

  // Toast notification function
  if (typeof showToast !== "function") {
    window.showToast = function (message, type = "info") {
      // Create toast container if it doesn't exist
      let toastContainer = document.getElementById("toast-container");
      if (!toastContainer) {
        toastContainer = document.createElement("div");
        toastContainer.id = "toast-container";
        toastContainer.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10000;
          pointer-events: none;
        `;
        document.body.appendChild(toastContainer);
      }

      const toast = document.createElement("div");
      toast.className = `toast ${type}`;
      toast.textContent = message;
      toast.style.cssText = `
        background: ${
          type === "success"
            ? "#4CAF50"
            : type === "error"
            ? "#f44336"
            : "#2196F3"
        };
        color: white;
        padding: 12px 24px;
        border-radius: 4px;
        margin-bottom: 10px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        animation: toast-slide-in 0.3s ease-out;
        pointer-events: auto;
      `;

      // Add CSS animation if not already defined
      if (!document.querySelector("#toast-styles")) {
        const style = document.createElement("style");
        style.id = "toast-styles";
        style.textContent = `
          @keyframes toast-slide-in {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes toast-slide-out {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
          }
        `;
        document.head.appendChild(style);
      }

      toastContainer.appendChild(toast);

      // Remove toast after 3 seconds
      setTimeout(() => {
        toast.style.animation = "toast-slide-out 0.3s ease-in forwards";
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 300);
      }, 3000);
    };
  }

  // Clean up old drafts on page load
  function cleanupOldDrafts() {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    keys.forEach((key) => {
      if (key.startsWith("feedbackDraft_")) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data.timestamp < oneDayAgo) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          // Remove corrupted draft
          localStorage.removeItem(key);
        }
      }
    });
  }

  // Run cleanup
  cleanupOldDrafts();
});