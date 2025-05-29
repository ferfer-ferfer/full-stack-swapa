        document.addEventListener("DOMContentLoaded", function () {
            const skillBoxes = document.querySelectorAll(".skill");
            const continueBtn = document.querySelector(".continue-btn");
            const selectedSkills = new Set();

            skillBoxes.forEach(skill => {
                skill.addEventListener("click", function () {
                    const skillName = this.textContent.trim();
                    this.classList.toggle("selected");

                    if (this.classList.contains("selected")) {
                        selectedSkills.add(skillName);
                    } else {
                        selectedSkills.delete(skillName);
                    }
                });
            });

            continueBtn.addEventListener("click", async function () {
                if (selectedSkills.size === 0) {
                    alert("Please select at least one skill.");
                    return;
                }

                try {
                    const res = await fetch('http://localhost:80/api/user/skills/teach', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('Token')}`
                        },
                        body: JSON.stringify({ teachSkills: Array.from(selectedSkills) })
                    });

                    const data = await res.json();
                    alert(data.message);

                    if (res.ok) {
                        window.location.href = "/congratulation.html";
                    }
                } catch (err) {
                    console.error('Error:', err);
                    alert('Something went wrong. Try again.');
                }
            });
        });