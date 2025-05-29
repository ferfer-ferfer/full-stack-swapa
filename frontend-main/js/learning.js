document.addEventListener("DOMContentLoaded", function () {
    const skillBoxes = document.querySelectorAll(".skill-learn");
    const continueBtn = document.querySelector(".continue-btn");
    const tableBody = document.getElementById("selected-skills-body"); // tbody of the table

    const selectedSkills = new Set(); // use Set to avoid duplicates

    // Toggle skill selection and update table
    skillBoxes.forEach(skill => {
        skill.addEventListener("click", function () {
            const skillName = this.textContent.trim();

            this.classList.toggle("selected");

            if (this.classList.contains("selected")) {
                selectedSkills.add(skillName);
                addSkillToTable(skillName);
            } else {
                selectedSkills.delete(skillName);
                removeSkillFromTable(skillName);
            }
        });
    });

    continueBtn.addEventListener("click", async function () {
        if (selectedSkills.size === 0) {
            alert("Please select at least one skill.");
            return;
        }

        try {
            const res = await fetch('http://localhost:80/api/user/skills/learn', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('Token')}`,
                },
                body: JSON.stringify({ learnSkills: Array.from(selectedSkills) })
            });

            const data = await res.json();
            alert(data.message);

            if (res.ok) {
                window.location.href = "/teaching.html";
            }
        } catch (err) {
            console.error('Error:', err);
            alert('Something went wrong. Try again.');
        }
    });

    function addSkillToTable(skill) {
        const row = document.createElement("tr");
        row.setAttribute("data-skill", skill);
        row.innerHTML = `<td>${skill}</td>`;
        tableBody.appendChild(row);
    }

    function removeSkillFromTable(skill) {
        const row = document.querySelector(`tr[data-skill="${skill}"]`);
        if (row) {
            row.remove();
        }
    }
});
