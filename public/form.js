
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("driverForm");
  const employmentBlock = document.getElementById("employmentBlock");

  document.getElementById("addJob").addEventListener("click", () => {
    const jobDiv = document.createElement("div");
    jobDiv.classList.add("employment-card");
    jobDiv.innerHTML = \`
      <label>Company: <input name="company[]" required></label>
      <label>Position: <input name="jobTitle[]" required></label>
      <label>Duration: <input name="jobDuration[]" required></label>
    \`;
    employmentBlock.appendChild(jobDiv);
  });

  const signaturePad = document.getElementById("signature-pad");
  const ctx = signaturePad.getContext("2d");
  let drawing = false;

  signaturePad.addEventListener("mousedown", () => drawing = true);
  signaturePad.addEventListener("mouseup", () => drawing = false);
  signaturePad.addEventListener("mouseout", () => drawing = false);
  signaturePad.addEventListener("mousemove", draw);

  function draw(event) {
    if (!drawing) return;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";
    ctx.lineTo(event.offsetX, event.offsetY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(event.offsetX, event.offsetY);
  }

  window.clearSignature = function () {
    ctx.clearRect(0, 0, signaturePad.width, signaturePad.height);
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(form);

    const signatureImage = signaturePad.toDataURL("image/png");
    formData.append("signature", signatureImage);

    fetch("/submit", {
      method: "POST",
      body: formData
    })
    .then(res => res.text())
    .then(data => {
      document.getElementById("status").textContent = data;
      form.reset();
      clearSignature();
    })
    .catch(err => {
      document.getElementById("status").textContent = "Error submitting form";
    });
  });
});
