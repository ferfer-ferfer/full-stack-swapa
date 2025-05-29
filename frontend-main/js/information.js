document.getElementById('profile-update-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData();

  // Append form values
  formData.append('Users_name', document.getElementById('userName').value);
  formData.append('first_name', document.getElementById('firstName').value);
  formData.append('last_name', document.getElementById('lastName').value);
  formData.append('telegram', document.getElementById('telegram').value);
  formData.append('discord', document.getElementById('discord').value);
  formData.append('birthday', document.getElementById('birth').value);
  formData.append('bio', "hey this is my bio");

  // Append the photo file (make sure your file input has id="profilePicture")
  const fileInput = document.getElementById('profile_picture');
  if (fileInput && fileInput.files.length > 0) {
    formData.append('profile_picture', fileInput.files[0]);
  }

  try {
    const res = await fetch('http://localhost:80/api/user/info', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('Token')}`,
      },
      body: formData,
    });

    const data = await res.json();
    alert(data.message);

    if (res.ok) {
      window.location.href = '/learning.html';
    }

  } catch (err) {
    console.error('Profile update error:', err);
    alert('Something went wrong during profile update.');
  }
});