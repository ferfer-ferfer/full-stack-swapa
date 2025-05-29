document.addEventListener("DOMContentLoaded", function () {
  // Get all dropdown containers
  const containers = document.querySelectorAll(".container");

  // Add click listeners to all containers
  containers.forEach((container) => {
    const icon = container.querySelector(".icon");
    const list = container.querySelector(".list");

    if (icon && list) {
      // Set initial state for GSAP animations
      gsap.set(list, {
        opacity: 0,
        y: -20,
        scale: 0.95,
        transformOrigin: "top right",
      });

      icon.addEventListener("click", function (e) {
        e.stopPropagation();

        // Close all other open dropdowns
        containers.forEach((otherContainer) => {
          if (
            otherContainer !== container &&
            otherContainer.classList.contains("active")
          ) {
            // Animate closing of other dropdowns
            const otherList = otherContainer.querySelector(".list");
            gsap.to(otherList, {
              opacity: 0,
              y: -20,
              scale: 0.95,
              duration: 0.25,
              ease: "power2.out",
              onComplete: () => {
                otherContainer.classList.remove("active");
              },
            });
          }
        });

        // Toggle current dropdown with animation
        if (!container.classList.contains("active")) {
          // Opening animation
          container.classList.add("active");
          gsap.to(list, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.3,
            ease: "back.out(1.2)",
          });
        } else {
          // Closing animation
          gsap.to(list, {
            opacity: 0,
            y: -20,
            scale: 0.95,
            duration: 0.25,
            ease: "power2.in",
            onComplete: () => {
              container.classList.remove("active");
            },
          });
        }
      });
    }
  });

  // Close dropdowns when clicking outside with animation
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".container")) {
      containers.forEach((container) => {
        if (container.classList.contains("active")) {
          const list = container.querySelector(".list");
          gsap.to(list, {
            opacity: 0,
            y: -20,
            scale: 0.95,
            duration: 0.25,
            ease: "power2.in",
            onComplete: () => {
              container.classList.remove("active");
            },
          });
        }
      });
    }
  });
// Real Notification System - Replace the existing notification code in home.js
class RealNotificationSystem {
    constructor() {
        this.notifications = [];
        this.init();
        this.fetchNotifications(); // Load real notifications on init
    }

    init() {
        this.bindEvents();
        this.addClickOutsideListener();
        
        // Set up periodic refresh every 30 seconds
        this.setupPeriodicRefresh();
    }

    bindEvents() {
        const notificationContainer = document.querySelector(".notification-container");
        const notificationIcon = notificationContainer?.querySelector(".notification-icon");
        const markAllRead = document.querySelector(".mark-all-read");

        if (notificationIcon) {
            notificationIcon.addEventListener("click", (e) => {
                e.stopPropagation();
                this.toggleNotificationList();
            });
        }

        if (markAllRead) {
            markAllRead.addEventListener("click", (e) => {
                e.stopPropagation();
                this.markAllAsRead();
            });
        }

        // Individual notification clicks to mark as read
        document.addEventListener("click", (e) => {
            const notificationItem = e.target.closest("li[data-notification-id]");
            if (notificationItem) {
                const id = parseInt(notificationItem.dataset.notificationId);
                this.markAsRead(id);
            }
        });
    }

    async fetchNotifications() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                console.log('No auth token found');
                return;
            }

            const response = await fetch('/api/notifications/get-notifications', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.notifications = await response.json();
                this.renderNotifications();
                this.updateBadge();
            } else if (response.status === 401) {
                console.log('Authentication failed');
                // Handle token expiration
                this.handleAuthError();
            } else {
                console.error('Failed to fetch notifications:', response.status);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }

    async getUnreadCount() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return 0;

            const response = await fetch('/api/notifications/unread-count', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                return data.count;
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
        return 0;
    }

    toggleNotificationList() {
        const list = document.querySelector(".notification-list");
        const isActive = list.classList.contains("active");

        if (isActive) {
            this.hideNotificationList();
        } else {
            this.showNotificationList();
            // Refresh notifications when opening
            this.fetchNotifications();
        }
    }

    showNotificationList() {
        const list = document.querySelector(".notification-list");
        list.classList.add("active");

        if (typeof gsap !== 'undefined') {
            gsap.fromTo(
                list,
                { opacity: 0, y: -10, scale: 0.95 },
                { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: "power2.out" }
            );
        }
    }

    hideNotificationList() {
        const list = document.querySelector(".notification-list");

        if (typeof gsap !== 'undefined') {
            gsap.to(list, {
                opacity: 0,
                y: -10,
                scale: 0.95,
                duration: 0.2,
                ease: "power2.in",
                onComplete: () => {
                    list.classList.remove("active");
                },
            });
        } else {
            list.classList.remove("active");
        }
    }

    addClickOutsideListener() {
        document.addEventListener("click", (e) => {
            const container = document.querySelector(".notification-container");
            if (container && !container.contains(e.target)) {
                this.hideNotificationList();
            }
        });
    }

    async markAllAsRead() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            const response = await fetch('/api/notifications/mark-all-read', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // Update UI immediately
                const unreadItems = document.querySelectorAll(".notification-list ul li.unread");
                
                unreadItems.forEach((item, index) => {
                    const dot = item.querySelector(".notification-dot");
                    if (dot && typeof gsap !== 'undefined') {
                        gsap.to(dot, {
                            scale: 0,
                            opacity: 0,
                            duration: 0.3,
                            delay: index * 0.05,
                            ease: "power2.in",
                            onComplete: () => {
                                dot.style.display = "none";
                                item.classList.remove("unread");
                            },
                        });
                    } else {
                        if (dot) dot.style.display = "none";
                        item.classList.remove("unread");
                    }
                });

                // Update badge
                const badge = document.querySelector(".notification-icon .badge");
                if (badge) {
                    if (typeof gsap !== 'undefined') {
                        gsap.to(badge, {
                            scale: 0,
                            opacity: 0,
                            duration: 0.3,
                            ease: "power2.in",
                            onComplete: () => {
                                badge.style.display = "none";
                            },
                        });
                    } else {
                        badge.style.display = "none";
                    }
                }

                // Update local notifications data
                this.notifications.forEach(notification => {
                    notification.isRead = true;
                });

                this.showSuccessMessage("All notifications marked as read!");
            } else {
                console.error('Failed to mark all as read');
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    }

    async markAsRead(notificationId) {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            const notification = this.notifications.find(n => n.id === notificationId);
            if (!notification || notification.isRead) return;

            const response = await fetch(`/api/notifications/mark-read/${notificationId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // Update UI
                const item = document.querySelector(`li[data-notification-id="${notificationId}"]`);
                const dot = item?.querySelector(".notification-dot");

                if (dot && typeof gsap !== 'undefined') {
                    gsap.to(dot, {
                        scale: 0,
                        opacity: 0,
                        duration: 0.3,
                        ease: "power2.in",
                        onComplete: () => {
                            dot.remove();
                            item.classList.remove("unread");
                        },
                    });
                } else if (dot) {
                    dot.remove();
                    item?.classList.remove("unread");
                }

                // Update local data
                notification.isRead = true;
                this.updateBadge();
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    async deleteNotification(notificationId) {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            const response = await fetch(`/api/notifications/delete/${notificationId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // Remove from local data
                this.notifications = this.notifications.filter(n => n.id !== notificationId);
                this.renderNotifications();
                this.updateBadge();
                this.showSuccessMessage("Notification deleted!");
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    }

    renderNotifications() {
        const container = document.querySelector(".notification-list ul");
        if (!container) return;

        container.innerHTML = "";

        if (this.notifications.length === 0) {
            container.innerHTML = '<li class="no-notifications"><p>No notifications yet</p></li>';
            return;
        }

        this.notifications.forEach((notification) => {
            const li = document.createElement("li");
            li.className = !notification.isRead ? "unread" : "";
            li.dataset.notificationId = notification.id;

            // Format the date
            const createdAt = new Date(notification.createdAt);
            const timeAgo = this.getTimeAgo(createdAt);

            li.innerHTML = `
                ${!notification.isRead ? '<div class="notification-dot"></div>' : ""}
                <div class="notification-content">
                    <p class="notification-text">${notification.message}</p>
                    <p class="notification-time">${timeAgo}</p>
                </div>
                <button class="delete-notification" onclick="notificationSystem.deleteNotification(${notification.id})" title="Delete notification">
                    <i class="fa-solid fa-times"></i>
                </button>
            `;

            container.appendChild(li);
        });

        // Animate new items if GSAP is available
        if (typeof gsap !== 'undefined') {
            gsap.fromTo(
                container.children,
                { x: -20, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.3, stagger: 0.05 }
            );
        }
    }

    async updateBadge() {
        const badge = document.querySelector(".notification-icon .badge");
        if (!badge) return;

        const unreadCount = await this.getUnreadCount();

        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = "flex";

            if (typeof gsap !== 'undefined') {
                gsap.fromTo(
                    badge,
                    { scale: 0.8 },
                    { scale: 1, duration: 0.3, ease: "elastic.out(1, 0.3)" }
                );
            }
        } else {
            badge.style.display = "none";
        }
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffInMs = now - date;
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);

        if (diffInMinutes < 1) {
            return "Just now";
        } else if (diffInMinutes < 60) {
            return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
        } else if (diffInHours < 24) {
            return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
        } else if (diffInDays < 7) {
            return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    setupPeriodicRefresh() {
        // Refresh notifications every 30 seconds
        setInterval(() => {
            this.fetchNotifications();
        }, 30000);

        // Also refresh when page becomes visible again
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.fetchNotifications();
            }
        });
    }

    handleAuthError() {
        // Redirect to login or handle token refresh
        localStorage.removeItem('authToken');
        window.location.href = '/login.html'; // Adjust path as needed
    }

    showSuccessMessage(message) {
        // Create temporary success message
        const successDiv = document.createElement("div");
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
            z-index: 10000;
            font-weight: 500;
        `;
        successDiv.textContent = message;
        document.body.appendChild(successDiv);

        if (typeof gsap !== 'undefined') {
            gsap.fromTo(
                successDiv,
                { x: 100, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.3, ease: "power2.out" }
            );
        }

        setTimeout(() => {
            if (typeof gsap !== 'undefined') {
                gsap.to(successDiv, {
                    x: 100,
                    opacity: 0,
                    duration: 0.3,
                    ease: "power2.in",
                    onComplete: () => successDiv.remove(),
                });
            } else {
                successDiv.remove();
            }
        }, 2000);
    }
}

// Initialize the real notification system
let notificationSystem;
document.addEventListener("DOMContentLoaded", () => {
    notificationSystem = new RealNotificationSystem();
});

// Export for global access
window.notificationSystem = notificationSystem;
  // Search suggestions animation
  const searchInput = document.querySelector('input[type="search"]');
  const suggestionTags = document.querySelectorAll(".suggestion-tag");

  if (searchInput && suggestionTags.length) {
    suggestionTags.forEach((tag, index) => {
      tag.addEventListener("click", function () {
        // Add a small bounce animation when clicking a tag
        gsap.to(tag, {
          scale: 1.1,
          duration: 0.2,
          ease: "power1.out",
          onComplete: () => {
            gsap.to(tag, {
              scale: 1,
              duration: 0.2,
              ease: "power1.in",
            });
            searchInput.value = tag.textContent;
            searchInput.focus();
          },
        });
      });

      // Add hover animations
      tag.addEventListener("mouseenter", () => {
        gsap.to(tag, {
          y: -3,
          duration: 0.2,
          ease: "power1.out",
        });
      });

      tag.addEventListener("mouseleave", () => {
        gsap.to(tag, {
          y: 0,
          duration: 0.2,
          ease: "power1.in",
        });
      });
    });
  }

  // Settings modal animations
  const modal = document.getElementById("modal");
  const settingBtn = document.getElementById("settingbtn");
  const closeBtn = document.getElementById("closeSettingsBtn");

  if (settingBtn && modal) {
    const settingsSidebar = modal.querySelector(".settings-sidebar");

    // Set initial state
    gsap.set(settingsSidebar, {
      opacity: 0,
      y: 30,
    });

    // Open modal with animation
    settingBtn.addEventListener("click", function () {
      modal.classList.add("active");
      document.body.style.overflow = "hidden";

      gsap.to(settingsSidebar, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: "power2.out",
      });
    });

    // Close modal with animation
    function closeModal() {
      gsap.to(settingsSidebar, {
        opacity: 0,
        y: 30,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          modal.classList.remove("active");
          document.body.style.overflow = "auto";
        },
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", closeModal);
    }

    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
        closeModal();
      }
    });
  }
});
class NotificationSystem {
  constructor() {
    this.notifications = [];
    this.isOpen = false;
    this.apiBaseUrl = "/api"; // Adjust this to match your API base URL

    this.initializeElements();
    this.bindEvents();
    this.loadNotifications();
    this.setupPeriodicRefresh();
  }

  initializeElements() {
    this.icon = document.getElementById("notificationIcon");
    this.list = document.getElementById("notificationList");
    this.badge = document.getElementById("notificationBadge");
    this.content = document.getElementById("notificationContent");
    this.markAllBtn = document.getElementById("markAllRead");
    this.viewAllLink = document.getElementById("viewAllLink");
  }

  bindEvents() {
    // Toggle dropdown
    this.icon.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleDropdown();
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!this.list.contains(e.target) && !this.icon.contains(e.target)) {
        this.closeDropdown();
      }
    });

    // Mark all as read
    this.markAllBtn.addEventListener("click", () => {
      this.markAllAsRead();
    });

    // Prevent dropdown from closing when clicking inside
    this.list.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }

  async loadNotifications() {
    try {
      this.showLoading();

      const response = await fetch(`${this.apiBaseUrl}/get-notifications`, {
        method: "GET",
        credentials: "include", // Include cookies for authentication
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const notifications = await response.json();
      this.notifications = notifications;
      this.renderNotifications();
      this.updateBadge();
    } catch (error) {
      console.error("Error loading notifications:", error);
      this.showError("Failed to load notifications");
    }
  }

  async loadUnreadCount() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/unread-count`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.updateBadgeCount(data.count);
      }
    } catch (error) {
      console.error("Error loading unread count:", error);
    }
  }

  renderNotifications() {
    if (this.notifications.length === 0) {
      this.showEmptyState();
      return;
    }

    const ul = document.createElement("ul");

    this.notifications.forEach((notification) => {
      const li = document.createElement("li");
      li.className = notification.isRead ? "" : "unread";
      li.dataset.id = notification.id;

      li.innerHTML = `
                        ${
                          !notification.isRead
                            ? '<div class="notification-dot"></div>'
                            : ""
                        }
                        <div class="notification-content">
                            <p class="notification-text">${this.escapeHtml(
                              notification.message
                            )}</p>
                            <p class="notification-time">${this.formatTime(
                              notification.createdAt
                            )}</p>
                        </div>
                    `;

      // Click to mark as read
      li.addEventListener("click", () => {
        if (!notification.isRead) {
          this.markAsRead(notification.id);
        }
      });

      ul.appendChild(li);
    });

    this.content.innerHTML = "";
    this.content.appendChild(ul);
  }

  async markAsRead(notificationId) {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/mark-read/${notificationId}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        // Update local state
        const notification = this.notifications.find(
          (n) => n.id == notificationId
        );
        if (notification) {
          notification.isRead = true;
        }
        this.renderNotifications();
        this.updateBadge();
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }

  async markAllAsRead() {
    try {
      this.markAllBtn.disabled = true;
      this.markAllBtn.textContent = "Marking...";

      const response = await fetch(`${this.apiBaseUrl}/mark-all-read`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Update local state
        this.notifications.forEach((n) => (n.isRead = true));
        this.renderNotifications();
        this.updateBadge();
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    } finally {
      this.markAllBtn.disabled = false;
      this.markAllBtn.textContent = "Mark all as read";
    }
  }

  updateBadge() {
    const unreadCount = this.notifications.filter((n) => !n.isRead).length;
    this.updateBadgeCount(unreadCount);
  }

  updateBadgeCount(count) {
    if (count > 0) {
      this.badge.textContent = count > 99 ? "99+" : count.toString();
      this.badge.classList.remove("hidden");
    } else {
      this.badge.classList.add("hidden");
    }
  }

  toggleDropdown() {
    if (this.isOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  openDropdown() {
    this.list.classList.add("active");
    this.isOpen = true;
    // Refresh notifications when opening
    this.loadNotifications();
  }

  closeDropdown() {
    this.list.classList.remove("active");
    this.isOpen = false;
  }

  showLoading() {
    this.content.innerHTML =
      '<div class="loading">Loading notifications...</div>';
  }

  showError(message) {
    this.content.innerHTML = `<div class="error">${message}</div>`;
  }

  showEmptyState() {
    this.content.innerHTML = `
                    <div class="empty-state">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 19V20H3V19L5 17V11C5 7.9 7 5.2 10 4.3V4C10 2.3 11.3 1 13 1S16 2.3 16 4V4.3C19 5.2 21 7.9 21 11V17L23 19ZM19 17V11C19 8.2 16.8 6 14 6S9 8.2 9 11V17H19Z" fill="currentColor"/>
                        </svg>
                        <p>No notifications yet</p>
                    </div>
                `;
  }

  formatTime(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60)
      return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return time.toLocaleDateString();
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  setupPeriodicRefresh() {
    // Refresh notifications every 30 seconds
    setInterval(() => {
      if (!this.isOpen) {
        this.loadUnreadCount();
      }
    }, 30000);
  }

  // Public method to refresh notifications
  refresh() {
    this.loadNotifications();
  }

  // Public method to add a new notification (for real-time updates)
  addNotification(notification) {
    this.notifications.unshift(notification);
    this.renderNotifications();
    this.updateBadge();
  }
}

// Initialize the notification system when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.notificationSystem = new NotificationSystem();
});

// Example of how to use the system programmatically
// You can call these from other parts of your application

// Refresh notifications manually
function refreshNotifications() {
  if (window.notificationSystem) {
    window.notificationSystem.refresh();
  }
}

// Add a new notification (useful for real-time updates via WebSocket)
function addNewNotification(notification) {
  if (window.notificationSystem) {
    window.notificationSystem.addNotification(notification);
  }
}
//dark mode button
document.addEventListener("DOMContentLoaded", function () {
  const toggleCheckbox = document.getElementById("checkbox");
  const root = document.documentElement;

  // Load saved theme from localStorage or default to light
  const savedTheme = localStorage.getItem("theme") || "light";

  // Set initial theme
  root.setAttribute("data-theme", savedTheme);

  // Ensure checkbox matches the current theme (checked for dark, unchecked for light)
  toggleCheckbox.checked = savedTheme === "dark";

  // Toggle theme when checkbox is clicked
  toggleCheckbox.addEventListener("change", function () {
    const newTheme = toggleCheckbox.checked ? "dark" : "light";
    root.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  });
});

// some loading animations cause why not ?

// Define the timeline globally but don't add animations yet
let masterTl;

document.addEventListener("DOMContentLoaded", function () {
  // Initialize the timeline
  masterTl = gsap.timeline({
    defaults: {
      duration: 0.7,
      ease: "power3.out",
      opacity: 0,
      stagger: 0.1,
    },
    paused: true, // Initialize as paused
  });

  // Add animations to the timeline
  masterTl
    .from(".logo", {
      y: -50,
      opacity: 0,
      ease: "power2.inOut",
    })
    .from(
      ".nav-right .container",
      {
        y: -50,
        opacity: 0,
        stagger: 0.2,
        ease: "power2.inOut",
      },
      "-=0.3"
    )
    .from(
      ".secondhdr .container",
      {
        opacity: 0,
        x: -50,
        ease: "power2.inOut",
      },
      "-=0.5"
    )
    .from(
      ".secondhdr .wallet-container",
      {
        opacity: 0,
        x: 50,
        ease: "power2.inOut",
      },
      "-=0.3"
    )
    .from(
      ".search-container",
      {
        opacity: 0,
        y: 50,
        ease: "back.out(1.7)",
      },
      "-=0.5"
    )
    .from(
      ".search-suggestions .suggestion-tag",
      {
        opacity: 0,
        y: 50,
        scale: 0.8,
        stagger: 0.1,
        ease: "back.out(1.7)",
      },
      "-=0.4"
    );
});

window.addEventListener("load", () => {
  if (masterTl) {
    masterTl.play();
  }
});

//settings

document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("modal");
  const settingBtn = document.getElementById("settingbtn");
  const closeBtn = document.getElementById("closeSettingsBtn");
  const themeDropdown = document.querySelector(".theme-setting");

  // Open modal
  settingBtn.addEventListener("click", function () {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  });

  // Close modal function
  function closeModal() {
    modal.classList.remove("active");
    document.body.style.overflow = "auto";
  }

  // Close modal with button
  closeBtn.addEventListener("click", closeModal);

  // Close modal when clicking outside
  modal.addEventListener("click", function (e) {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Prevent propagation for modal content
  const sidebar = document.querySelector(".settings-sidebar");
  sidebar.addEventListener("click", function (e) {
    e.stopPropagation();
  });
});

// Search functionality

document.addEventListener("DOMContentLoaded", function () {
  const searchContainer = document.querySelector(".search-container");
  const searchInput = document.querySelector('input[type="search"]');
  const searchSuggestions = document.querySelector(".search-suggestions");
  const mainContent = document.querySelector("main");
  const rightelement = document.querySelectorAll(".right-ele");
  const leftelement = document.querySelectorAll(".left-ele");
  const head2 = document.querySelector(".secondhdr");
  const suggestions = document.querySelectorAll(".suggestion-tag");

  const searchResultsContainer = document.createElement("div");
  searchResultsContainer.className = "search-results";
  searchResultsContainer.style.display = "none";
  mainContent.appendChild(searchResultsContainer);

  const backButton = document.createElement("button");
  backButton.className = "back-button";
  backButton.innerHTML =
    '<i class="fa-solid fa-arrow-left"></i> <span class="back-text">Back</span>';
  backButton.style.display = "none";
  document.body.appendChild(backButton);

  let originalSearchPosition = {};
  let originalSearchStyles = {};
  let searchAnimationPlayed = false;
  const animationDuration = 0.7;

  function performSearchAnimation(callback) {
    if (searchAnimationPlayed) {
      if (callback) callback();
      return;
    }

    const searchContainerRect = searchContainer.getBoundingClientRect();
    const isMobile = window.innerWidth <= 768;

    originalSearchPosition = {
      top: searchContainerRect.top,
      left: searchContainerRect.left,
      width: searchContainerRect.width,
    };

    originalSearchStyles = {
      position: searchContainer.style.position,
      top: searchContainer.style.top,
      left: searchContainer.style.left,
      width: searchContainer.style.width,
      transform: searchContainer.style.transform,
    };

    searchContainer.style.position = "fixed";
    searchContainer.style.top = originalSearchPosition.top + "px";
    searchContainer.style.left = originalSearchPosition.left + "px";
    searchContainer.style.width = originalSearchPosition.width + "px";
    searchContainer.style.zIndex = "1000";
    searchContainer.style.transform = "none";

    const tl = gsap.timeline({
      onComplete: function () {
        if (callback) callback();
        searchAnimationPlayed = true;
      },
    });

    tl.to(rightelement, {
      x: 100,
      opacity: 0,
      ease: "power2.inOut",
      duration: 0.5,
      stagger: 0.2,
    })
      .to(
        leftelement,
        {
          x: -100,
          opacity: 0,
          ease: "power2.inOut",
          duration: 0.5,
          stagger: 0.2,
        },
        "<"
      )
      .to(
        suggestions,
        {
          opacity: 0,
          scale: 0.8,
          stagger: 0.1,
          duration: 0.2,
          ease: "power2.inOut",
          onComplete: () => {
            suggestions.forEach((tag) => {
              tag.style.opacity = "1";
              tag.style.transform = "scale(1)";
            });
            searchSuggestions.style.display = "none";
          },
        },
        "<"
      );

    if (isMobile) {
      tl.to(
        searchContainer,
        {
          top: "15px",
          left: "70px",
          width: "calc(100% - 85px)",
          duration: 0.5,
          ease: "power2.inOut",
        },
        "-=0.5"
      );
    } else {
      tl.to(
        searchContainer,
        {
          top: "15px",
          left: "50%",
          xPercent: -50,
          duration: 0.5,
          ease: "power2.inOut",
        },
        "-=0.5"
      );
    }
    tl.to(
      mainContent,
      {
        zIndex: 2000,
        y: 0,
        ease: "power2.inOut",
        duration: 0.3,
      },
      "-=0.6"
    );
    backButton.style.display = "flex";
    tl.fromTo(
      backButton,
      { opacity: 0, x: -20, scale: 0.8 },
      { opacity: 1, x: 0, scale: 1, duration: 0.2, ease: "power2.inOut" },
      0.3
    );
  }

  function createProfileCard(user) {
    const card = document.createElement("div");
    card.className = "profile-card";
    card.style.marginBottom = "20px"; // Add spacing between cards

    // Add hover animation effect
    card.addEventListener("mouseenter", () => {
      card.style.transform = "translateY(-5px)";
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "translateY(0)";
    });

    // Profile card header with image and info
    const header = document.createElement("div");
    header.className = "profile-card-header";

    const img = document.createElement("img");
    img.src = user.image || "icons/profile.png";
    img.alt = `${user.firstName} ${user.lastName}`;
    img.className = "profile-image";

    const info = document.createElement("div");
    info.className = "profile-info";

    const name = document.createElement("h3");
    name.textContent = `${user.firstName} ${user.lastName}`;

    const ratingContainer = document.createElement("div");
    ratingContainer.className = "profile-rating";

    const stars = document.createElement("span");
    stars.innerHTML = Array(5)
      .fill()
      .map((_, i) => {
        if (i < Math.floor(user.rating)) {
          return '<i class="fa-solid fa-star"></i>';
        } else if (i === Math.floor(user.rating) && user.rating % 1 >= 0.5) {
          return '<i class="fa-solid fa-star-half-stroke"></i>';
        } else {
          return '<i class="fa-regular fa-star"></i>';
        }
      })
      .join("");

    const ratingValue = document.createElement("span");
    ratingValue.className = "rating-value";
    ratingValue.textContent = user.rating.toFixed(1);

    ratingContainer.appendChild(stars);
    ratingContainer.appendChild(ratingValue);

    const experience = document.createElement("div");
    experience.className = "profile-experience";
    experience.textContent = `${user.experience || "N/A"} years experience`;

    info.appendChild(name);
    info.appendChild(ratingContainer);
    info.appendChild(experience);

    header.appendChild(img);
    header.appendChild(info);

    // Skills section
    const skillsContainer = document.createElement("div");
    skillsContainer.className = "profile-skills";

    user.skills.forEach((skill) => {
      const skillTag = document.createElement("span");
      skillTag.className = "skill-tag";
      skillTag.textContent = skill;
      skillsContainer.appendChild(skillTag);
    });

    // Buttons container
    const buttonGroup = document.createElement("div");
    buttonGroup.className = "buttons-container";

    const viewBtn = document.createElement("button");
    viewBtn.className = "contact-button";
    viewBtn.textContent = "View Profile";

    // View profile functionality
    viewBtn.addEventListener("click", () => {
      localStorage.setItem("viewUserId", user.id);
      window.location.href = "profil.html";
    });

    buttonGroup.appendChild(viewBtn);

    // Assemble the card
    card.appendChild(header);
    card.appendChild(skillsContainer);
    card.appendChild(buttonGroup);

    return card;
  }

  // Function to revert to home view
  function revertToHomeView() {
    const tl = gsap.timeline();
    // Hide back button first
    tl.to(backButton, {
      opacity: 0,
      x: -20,
      scale: 0.8,
      duration: 0.3,
      onComplete: () => {
        backButton.style.display = "none";
        backButton.style.x = 0;
        backButton.style.scale = 1;
      },
    })

      // Hide search results with animation
      .to(
        searchResultsContainer,
        {
          opacity: 0,
          y: 20,
          duration: 0.3,
          onComplete: () => {
            searchResultsContainer.style.display = "none";
            searchResultsContainer.style.marginTop = "0"; // Reset margin
          },
        },
        "-=0.3"
      );

    // Animate search container back to original position
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      gsap.to(searchContainer, {
        top: originalSearchPosition.top + "px",
        left: originalSearchPosition.left + "px",
        width: originalSearchPosition.width + "px",
        duration: 0.5,
        ease: "power2.inOut",
        clearProps: "all", // Clear all properties after animation
        onComplete: completeReturn,
      });
    } else {
      gsap.to(searchContainer, {
        top: originalSearchPosition.top + "px",
        left: originalSearchPosition.left + "px",
        width: originalSearchPosition.width + "px",
        xPercent: 0, // Remove any percentage-based transforms
        duration: 0.5,
        ease: "power2.inOut",
        clearProps: "all", // Clear all properties after animation
        onComplete: completeReturn,
      });
    }

    function completeReturn() {
      // Restore original styles completely
      for (const prop in originalSearchStyles) {
        searchContainer.style[prop] = originalSearchStyles[prop];
      }

      // Create a GSAP timeline
      const tl = gsap.timeline();

      // Add animations to the timeline
      tl.to(rightelement, {
        x: 0,
        opacity: 1,
        ease: "power2.inOut",
        duration: 0.5,
        stagger: 0.2,
      })
        .to(
          leftelement,
          {
            x: 0,
            opacity: 1,
            ease: "power2.inOut",
            duration: 0.5,
            stagger: 0.2,
          },
          "<"
        ) // Use "<" to start this animation at the same time as the previous one
        .to(
          mainContent,
          {
            zIndex: 1,
            ease: "power2.inOut",
            duration: 0.5,
          },
          "<"
        ) // Start this animation at the same time as the previous one
        .to(
          suggestions,
          {
            display: "flex",
            opacity: 1,
            scale: 1,
            stagger: 0.1,
            duration: 0.4,
            ease: "power2.inOut",
          },
          "-=0.5"
        );
    }

    // Clear search input
    searchInput.value = "";

    // Reset the animation played flag when returning to home
    searchAnimationPlayed = false;
  }

  async function fetchProfilesFromAPI(query) {
    try {
      const response = await fetch(
        `http://localhost:80/api/search/search?skill=${encodeURIComponent(
          query
        )}`
      );
      if (!response.ok) throw new Error("Network response was not ok");
      const users = await response.json();
      return users;
    } catch (err) {
      console.error("API fetch error:", err);
      return null;
    }
  }

  async function renderSearchResults(query) {
    // Clear previous results
    searchResultsContainer.innerHTML = "";

    // Fetch profiles
    const matchedProfiles = await fetchProfilesFromAPI(query);

    // If fetch failed or returned null
    if (!matchedProfiles) {
      const errorDiv = document.createElement("div");
      errorDiv.className = "error-message";
      errorDiv.textContent = "Failed to fetch profiles. Please try again.";
      searchResultsContainer.appendChild(errorDiv);
      searchResultsContainer.style.display = "block";
      return;
    }

    // Show message if no results
    if (matchedProfiles.length === 0) {
      const noResults = document.createElement("div");
      noResults.className = "no-results";
      noResults.innerHTML = `
      <i class="fa-solid fa-search"></i>
      <h3>No profiles found for "${query}"</h3>
    `;
      searchResultsContainer.appendChild(noResults);
      searchResultsContainer.style.display = "block";
      return;
    }

    // Otherwise, create and append profile cards
    matchedProfiles.forEach((user) => {
      const profileCard = createProfileCard(user);
      searchResultsContainer.appendChild(profileCard);
    });

    searchResultsContainer.style.display = "block";
  }

  async function displaySearchResults(query) {
    await new Promise((resolve) => {
      performSearchAnimation(async () => {
        await renderSearchResults(query);
        resolve();
      });
    });
  }

  searchInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter" && searchInput.value.trim() !== "") {
      displaySearchResults(searchInput.value.trim());
    }
  });

  backButton.addEventListener("click", revertToHomeView);

  suggestions.forEach((tag) => {
    tag.addEventListener("click", function () {
      gsap.to(tag, {
        scale: 1.1,
        duration: 0.2,
        ease: "power1.out",
        onComplete: () => {
          gsap.to(tag, {
            scale: 1,
            duration: 0.2,
            ease: "power1.in",
            onComplete: () => {
              searchInput.value = tag.textContent;
              displaySearchResults(tag.textContent);
            },
          });
        },
      });
    });
  });
});

// Sp points
document.addEventListener("DOMContentLoaded", () => {
  fetchUserBalance();
});
async function fetchUserBalance() {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("No token found");
    return;
  }

  try {
    const response = await fetch("http://localhost:80/api/sp/balance", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Fetch error:", response.status, errorText);
      return;
    }

    const data = await response.json();
    console.log("Balance response:", data);

    const creditsSpan = document.querySelector(".credits");
    if (creditsSpan && data.spPoints !== undefined) {
      creditsSpan.textContent = `${data.spPoints.toLocaleString()} Credits`;
    }
  } catch (error) {
    console.error("Error fetching balance:", error);
  }
}

//profile
document.addEventListener("DOMContentLoaded", () => {
  loadUserProfile();
});

async function loadUserProfile() {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("No token found");
    return;
  }

  try {
    const response = await fetch("http://localhost:80/api/user/profile", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Failed to load profile");

    const user = await response.json();

    // Update DOM elements
    const avatarImg = document.querySelector(".user-avatar img");
    const profileImg = document.querySelector(".profile-icon img");
    const userName = document.getElementById("username");
    const userEmail = document.getElementById("useremail");

    profileImg.src = user.profile_picture || "icons/profile.png";
    avatarImg.src = user.profile_picture || "icons/profile.png";
    userName.textContent =
      user.Users_name || `${user.first_name} ${user.last_name}`;
    userEmail.textContent = user.email || "No email";
  } catch (error) {
    console.error("Error loading profile:", error);
  }
}

//singup
document.addEventListener("DOMContentLoaded", () => {
  const signOutBtn = document.getElementById("signout");
  if (signOutBtn) {
    signOutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("viewUserId");
      window.location.href = "index.html";
    });
  }
});

//profile
document.addEventListener("DOMContentLoaded", () => {
  // Profile redirect logic
  const profileLink = document.getElementById("profile-link");
  if (profileLink) {
    profileLink.addEventListener("click", () => {
      window.location.href = "profil-user.html";
    });
  }
});
