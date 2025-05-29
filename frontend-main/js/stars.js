document.addEventListener('DOMContentLoaded', function() {
    const stars = document.querySelectorAll('.star');
    let rating = 0;
    
    // Function to update stars based on rating
    function updateStars(selectedRating) {
        stars.forEach((star, index) => {
            // Clear existing classes
            star.classList.remove('selected');
            
            // Update the star's HTML based on rating
            if (index < selectedRating) {
                star.classList.add('selected');
                star.innerHTML = '<i class="fa-solid fa-star"></i>';
                gsap.to(star, {
                    color: '#FFB800',
                    duration: 0.2
                });
            } else {
                star.innerHTML = '<i class="fa-regular fa-star"></i>';
                gsap.to(star, {
                    color: '#ddd',
                    duration: 0.2
                });
            }
        });
    }
    
    // Add event listeners for all stars
    stars.forEach((star, index) => {
        // Show hover effect
        star.addEventListener('mouseenter', () => {
            for (let i = 0; i <= index; i++) {
                stars[i].innerHTML = '<i class="fa-solid fa-star"></i>';
                if (i >= rating) {
                    gsap.to(stars[i], {
                        color: '#FFB800',
                        opacity: 0.7,
                        duration: 0.2
                    });
                }
            }
        });
        
        star.addEventListener('mouseleave', () => {
            // Only reset stars that aren't part of the rating
            updateStars(rating);
        });
        
        star.addEventListener('click', () => {
            // Set new rating
            rating = index + 1;
            
            // Update the visual state of all stars
            updateStars(rating);
        });
    });
    
    // Reset unselected stars when mouse leaves the container
    document.querySelector('.stars').addEventListener('mouseleave', () => {
        updateStars(rating);
    });
});