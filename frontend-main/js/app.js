

gsap.to(".hero-img", {
  y: 30, // Moves up & down by 30px
  duration: 1.5,// Time for one complete motion
  repeat: -1, // Infinite loop
  yoyo: true,
  ease: "power2.inOut", 
});



// Create a master timeline
const masterTl = gsap.timeline({
    defaults: {
      duration: 0.6,
      ease: "power3.out",
      opacity: 0,
    },
});
  
// First animate the logo
masterTl
  .from(".logo", {
    y: -30,
    delay: 0.5,
    opacity: 0,
    duration: 0.8,
  })

  // Then animate each nav item one by one
  .from(
    "ul li",
    {
      y: -25,
      stagger: 0.08,
    },
    "-=0.3"
  )

  // Finally animate the button
  .from(
    ".header-right",
    {
      scale: 0.85,
      y: -15,
      duration: 0.5,
    },
    "-=0.4"
  )

  .from(
    ".hero-text", 
    {
      x: -80,
      opacity: 0,
      duration: 1,
      ease: "power2.out",
      delay: 0.3
    },
    "-=0.6"
  )

  .from(
    ".img-container", 
    {
      x: 80,
      opacity: 0,
      duration: 1,
      ease: "power2.out",
      delay: 0.3
    },
    "-=0.8"
  )

  // Add animation for tagline h2
  .from(".tagline h2", {
    y: 50,
    opacity: 0,
    duration: 0.8,
    ease: "back.out(1.7)",
  }, "-=0.4")
  
  // Add animation for tagline h3 with a slight delay for sequencing
  .from(".tagline h3", {
    y: 30,
    opacity: 0,
    duration: 0.8,
    ease: "back.out(1.7)",
  }, "-=0.6");

// Trigger animation on page load
window.addEventListener("load", () => {
    masterTl.play();
});


// scroll animations 

gsap.timeline({
    scrollTrigger: {
      trigger: ".about-us-section",
      start: "top 80%",
      end: "top 50%",
      toggleActions: "play none none none" // Play on enter, reverse on leave
    }
})
  
  
.from(".about-us-section h2", {
    y: 20,
    opacity: 0,
    duration: 0.7,
    delay: 0.2,
    ease: "back.out(1.7)",
  })
.from(".about-us-section h3", {
    y: 50, // Text slides up
    opacity: 0,
    delay: 0.2,
    duration: 0.6,
    ease: "back.out(1.7)",
},"-=0.9");

// features animations

gsap.timeline({
  scrollTrigger: {
    trigger: ".features",
    start: "top 80%",
    end: "top 50%",
    toggleActions: "play none none none" 
  }
})

.from(".features h2",{
  y: 30,
  opacity: 0,
  delay: 0.2,
  duration: 0.7,
  ease: "back.out(1.7)",
})
.from(".feature-card", {
  y: 30,
  opacity: 0,
  duration: 0.7,
  delay: 0.2,
  ease: "back.out(1.7)",
  stagger: 0.1,
},"-=0.5");


// showcase 

gsap.timeline({
  scrollTrigger:{
    trigger :".showcase",
    start: "top 80%",
    end: "top 50%",
    toggleActions:"play none none none"
  }
})
.from(".showcase h2",{
  y: 30,
  opacity: 0,
  duration: 0.7,
  delay: 0.1,
  ease: "back.out(1.7)",
})
.from(".showcase-card", {
  y: 30,
  opacity: 0,
  duration: 0.7,
  delay: 0.2,
  ease: "back.out(1.7)",
  stagger: 0.1,
},"-=0.5");


// contact

gsap.timeline({
  scrollTrigger:{
    trigger :".contact",
    start: "top 80%",
    end: "top 50%",
    toggleActions:"play none none none"
  }
})
.from(".contact-text h2, .contact-text p, .contact-text img",{
  y: 30,
  opacity: 0,
  duration: 0.8,
  delay: 0.2,
  stagger: 0.1,
  ease: "back.out(1.7)",
})
.from("input, textarea, button", {
  y: 30,
  opacity: 0,
  duration: 0.8,
  delay: 0.2,
  ease: "back.out(1.7)",
  stagger: 0.1,
},"-=0.8");



// navigation scroll 

document.querySelectorAll(".nav-list a").forEach(link => {
  link.addEventListener("click", function(e) {
      e.preventDefault(); // Prevent default anchor behavior

      const targetId = this.getAttribute("href").substring(1); // Remove #
      const targetSection = document.getElementById(targetId);

      if (targetSection) {
          const offset = 80; // Adjust if you have a fixed header
          const targetPosition = targetSection.offsetTop - offset;

          window.scrollTo({
              top: targetPosition,
              behavior: "smooth"
          });
      }
  });
});



// load page on top 


window.onbeforeunload = function () {
  window.scrollTo(0, 0);
};


// light-dark mode 

document.addEventListener("DOMContentLoaded", function () {
  const toggleCheckbox = document.getElementById("checkbox"); // Ensure correct ID
  const root = document.documentElement; // Target <html> for CSS variables

  // Load saved theme from localStorage or default to light
  const savedTheme = localStorage.getItem("theme") || "light";
  
  // Set initial theme
  root.setAttribute("data-theme", savedTheme);
  
  // Ensure checkbox matches the correct state
  toggleCheckbox.checked = savedTheme === "light"; // This fixes the inversion

  // Toggle theme when checkbox is clicked
  toggleCheckbox.addEventListener("change", function () {
      const newTheme = toggleCheckbox.checked ? "light" : "dark"; // Fix inversion
      root.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
  });
});




//contact form
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.contact-form');

  if (!form) {
    console.error('Contact form not found!');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = form.querySelector('input[type="text"]').value.trim();
    const email = form.querySelector('input[type="email"]').value.trim();
    const message = form.querySelector('textarea').value.trim();

    if (!name || !email || !message) {
      alert('Please fill in all fields.');
      return;
    }

    try {
      const response = await fetch('http://localhost:80/api/auth/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, message }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message);
        form.reset();
      } else {
        alert(result.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while sending the message.');
    }
  });
});
