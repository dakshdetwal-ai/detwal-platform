(() => {
  const $ = (id) => document.getElementById(id);
  const form = $("entry-form"), message = $("form-message"), continueBtn = $("continue-btn");
  const wheelView = $("wheel-view"), deniedView = $("denied-view"), usedView = $("used-view");
  const wheel = $("wheel"), spinBtn = $("spin-btn"), result = $("spin-result");
  $("year").textContent = new Date().getFullYear();

  const SUPABASE_URL = "https://evsnwenvmwhrohyzrjgq.supabase.co";
  const SUPABASE_KEY = "sb_publishable_Vfy2VLbqRYB_DOsK13iuqA_9-pk4Q5t";
  const ENDPOINT = SUPABASE_URL + "/functions/v1/promo-spin-entry";
  const show = (el) => { el.hidden = false; };
  let spinStarted = false;

  function getDeviceId() {
    const key = "detwal_promo_device_v1";
    let id = localStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(key, id);
    }
    return id;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.textContent = "";
    const name = $("visitor-name").value.trim();
    const age = Number($("visitor-age").value);
    if (!name || name.length > 60 || !Number.isInteger(age) || age < 1 || age > 120) {
      message.textContent = "Please enter a valid name and age.";
      return;
    }
    if (age < 18) {
      form.hidden = true;
      show(deniedView);
      return;
    }

    continueBtn.disabled = true;
    continueBtn.textContent = "Checking entry…";
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY },
        body: JSON.stringify({ name, age, deviceId: getDeviceId() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not verify your entry.");
      form.hidden = true;
      if (data.eligible === false) show(deniedView);
      else if (data.alreadyUsed) show(usedView);
      else show(wheelView);
    } catch (error) {
      message.textContent = error.message || "Something went wrong. Please try again.";
      continueBtn.disabled = false;
      continueBtn.innerHTML = 'Continue to wheel <span aria-hidden="true">→</span>';
    }
  });

  spinBtn.addEventListener("click", () => {
    if (spinStarted) return;
    spinStarted = true;
    spinBtn.disabled = true;
    spinBtn.textContent = "Spinning…";
    wheel.classList.remove("spinning");
    void wheel.offsetWidth;
    wheel.classList.add("spinning");
    window.setTimeout(() => {
      result.textContent = "Better Luck Next Time!";
      spinBtn.textContent = "Entry completed";
    }, 4300);
  });
})();