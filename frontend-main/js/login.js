
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const signupLinks = document.querySelectorAll('.signup-link, .register-link');
    const loginLinks = document.querySelectorAll('.login-link, .signin-link');
    
    // Animate initial form elements
    animateElements(loginForm);
    
    // Function to animate form elements sequentially
    function animateElements(form) {
        const elements = form.querySelectorAll('.form-element');
        elements.forEach((element, index) => {
            setTimeout(() => {
                element.classList.add('animate-element');
            }, 100 * index);
        });
    }
    
    // Function to reset animations
    function resetAnimations(form) {
        const elements = form.querySelectorAll('.form-element');
        elements.forEach(element => {
            element.classList.remove('animate-element');
        });
    }
    
    // Function to switch from login to signup
    function showSignup() {
        // First slide out the login form
        loginForm.classList.add('slide-out-up');
        
        setTimeout(() => {
            // Hide login form
            loginForm.classList.remove('active');
            loginForm.classList.add('inactive');
            
            // Reset animations for signup form elements
            resetAnimations(signupForm);
            
            // Show signup form (slides from top)
            signupForm.classList.remove('inactive');
            signupForm.classList.add('active', 'slide-in-down');
            
            // Animate form elements sequentially
            setTimeout(() => {
                animateElements(signupForm);
            }, 400);
            
            // Remove animation classes after animation completes
            setTimeout(() => {
                loginForm.classList.remove('slide-out-up');
                signupForm.classList.remove('slide-in-down');
            }, 600);
        }, 300);
    }
    
    // Function to switch from signup to login
    function showLogin() {
        // First slide out the signup form
        signupForm.classList.add('slide-out-up');
        
        setTimeout(() => {
            // Hide signup form
            signupForm.classList.remove('active');
            signupForm.classList.add('inactive');
            
            // Reset animations for login form elements
            resetAnimations(loginForm);
            
            // Show login form (slides from top)
            loginForm.classList.remove('inactive');
            loginForm.classList.add('active', 'slide-in-down');
            
            // Animate form elements sequentially
            setTimeout(() => {
                animateElements(loginForm);
            }, 400);
            
            // Remove animation classes after animation completes
            setTimeout(() => {
                signupForm.classList.remove('slide-out-up');
                loginForm.classList.remove('slide-in-down');
            }, 600);
        }, 300);
    }
    
    // Add event listeners to all signup links
    signupLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            showSignup();
        });
    });
    
    // Add event listeners to all login links
    loginLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            showLogin();
        });
    });
});






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

masterTl = gsap.timeline({
    defaults: {
        duration: 0.7,
        ease: "power3.out",
        opacity: 0,
        stagger: 0.1,
    },
});

// First animate the logo and robot
masterTl
.from(".login-image", {
    y: -50,
    opacity: 0,
    ease: "power2.inOut",
})
.from(".robot", {
    y: -50,
    opacity: 0,
    delay: 0.2,
    ease: "power2.inOut",
    onComplete: function() { 
        // Start the floating animation AFTER the loading animation
        gsap.to(".robot", {
            y: 30, // Moves up & down by 30px
            duration: 1.5, // Time for one complete motion
            repeat: -1, // Infinite loop
            yoyo: true,
            ease: "power2.inOut",
        });
    }
});

window.addEventListener("load", () => {
    masterTl.play();
});




// reset password 

  // GSAP Modal Animation
const resetBtn = document.getElementById('resetBtn'); 
const resetModal = document.getElementById('resetModal');
const closeBtn = resetModal.querySelector('.close-btn');
const modalContent = resetModal.querySelector('.modal-content');

// Hide modal initially
gsap.set(resetModal, { display: 'none', opacity: 0 });
gsap.set(modalContent, { scale: 0.7, opacity: 0 });

// Open Modal Function
function openModal() {
  gsap.to(resetModal, {
    display: 'flex',
    opacity: 1,
    duration: 0.3,
    ease: 'power2.out'
  });

  gsap.to(modalContent, {
    scale: 1,
    opacity: 1,
    duration: 0.4,
    ease: 'back.out(1.7)', // Gives a slight bounce effect
    delay: 0.1
  });
}

// Close Modal Function
function closeModal() {
  gsap.to(modalContent, {
    scale: 0.7,
    opacity: 0,
    duration: 0.3,
    ease: 'power2.in'
  });

  gsap.to(resetModal, {
    opacity: 0,
    display: 'none',
    duration: 0.3,
    delay: 0.2
  });
}

// Event Listeners
resetBtn.addEventListener('click', () => {
  setTimeout(openModal, 0); // Optional delay
});

closeBtn.addEventListener('click', closeModal);

// Optional: Close modal when clicking outside
resetModal.addEventListener('click', (e) => {
  if (e.target === resetModal) {
    closeModal();
  }
});



// Registration Form Submission

document.getElementById('signup-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const first_name = document.getElementById('firstname').value.trim();
  const last_name = document.getElementById('lastname').value.trim();
  const email = document.getElementById('regemail').value.trim();
  const password = document.getElementById('regpassword').value.trim();
  const termsAccepted = document.getElementById('terms').checked;

  // Check if any field is empty
  if (!email || !password || !first_name || !last_name) {
    alert("Please fill out all fields.");
    return;
  }

  if (!termsAccepted) {
    alert("You must agree to the Terms of Service and Privacy Policy.");
    return;
  }

  const userData = {
    email,
    password,
    first_name,
    last_name,
  };

  try {
    const res = await fetch('http://localhost:80/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await res.json();
    alert(data.message);

    if (res.ok  ) { 
      // Redirect to verification page
      window.location.href = '/verify.html';
    } else {alert("no no no "); }

  } catch (err) {
    console.error('Registration error:', err);
    alert('Something went wrong during registration.');
  }
});

// Login Form Submission
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  // Check if any field is empty
  if (!email || !password ) {
    alert("Please fill out all fields.");
    return;
  }

  const userData = {
    email,
    password,
  };

  try {
    const res = await fetch('http://localhost:80/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData), // Send the data as JSON
    });

    const data = await res.json();
    alert(data.message);

   if (res.ok) {
     
      if (!data.verified) {
        alert("Please verify your email before logging in.");
        window.location.href = '/verify.html'; 
       
      } else{
     
      localStorage.setItem('token', data.token);
      window.location.href = '/home.html'; 

  }}

  } catch (err) {
    console.error('Login error:', err);
    alert('Something went wrong during login.');
  }
});


// Password Recovery Form Submission
document.getElementById('recover-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('recover-email').value.trim();

  // Check if email field is empty
  if (!email) {
    alert("Please enter your email.");
    return;
  }

  const userData = { email };
  localStorage.setItem('verifiedEmail', email);


  try {
    const res = await fetch('http://localhost:80/api/auth/recover', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData), 
    });

    const data = await res.json();
    alert(data.message);



  } catch (err) {
    console.error('Password Recovery error:', err);
    alert('Something went wrong during password recovery.');
  }
});
 
//verify code form submission
document.getElementById('verify-code-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const code = document.getElementById('verify-code').value.trim();
 const verifiedEmail = localStorage.getItem('verifiedEmail');
  console.log(verifiedEmail);
  if ( !code ) {
    alert('Please enter the code.');
    return;
  }
  if (!verifiedEmail) {
    alert('Please enter your email first.');
    return;
  }

  try {
    const res = await fetch('http://localhost:80/api/auth/verify-reset-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: verifiedEmail, code })
    });

    const data = await res.json();
    alert(data.message);

    if (res.ok) {
      // Optionally show the password reset form
     document.getElementById('resetModal').style.display = 'block';
    
     window.location.href = '/Pass-change.html'; 

    }

  } catch (err) {
    console.error('Code verification error:', err);
    alert('Something went wrong.');
  }
});

    function loginWith(provider) {
      if (provider === 'apple') {
        alert('Apple login is coming soon!');
        return;
      }

      const authUrl = `http://localhost:80/api/auth/${provider}`;
      console.log("Redirecting to:", authUrl);
      window.location.href = authUrl;
    }

    document.addEventListener('DOMContentLoaded', () => {
      // Attach click listeners after DOM is ready
      document.getElementById('google-login').addEventListener('click', () => loginWith('google'));
      document.getElementById('facebook-login').addEventListener('click', () => loginWith('facebook'));
      document.getElementById('apple-login').addEventListener('click', () => loginWith('apple'));
    });
