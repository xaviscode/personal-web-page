(function () {
  const qEl = document.getElementById("ragQuestion");
  const sendEl = document.getElementById("ragSend");
  const statusEl = document.getElementById("ragStatus");
  const ansEl = document.getElementById("ragAnswer");
  const sourcesWrapEl = document.getElementById("ragSources");
  const sourcesListEl = document.getElementById("ragSourcesList");
  const showSourcesEl = document.getElementById("ragShowSources");
  const apiBaseEl = document.getElementById("ragApiBase");

  const chips = document.querySelectorAll(".rag__chip");

  const LOREM_LINES = [
    "Generating answer...",
  ];

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function setAnswer(text, animateClass) {
    ansEl.classList.remove("animate__fadeIn", "animate__fadeInUp");
    ansEl.innerHTML = "";
    const div = document.createElement("div");
    div.textContent = text;
    ansEl.appendChild(div);

    if (animateClass) {
      ansEl.classList.add("animate__animated", animateClass);
      setTimeout(() => ansEl.classList.remove(animateClass), 700);
    }
  }

  function setSources(sources) {
    sourcesListEl.innerHTML = "";
    if (!showSourcesEl.checked || !Array.isArray(sources) || sources.length === 0) {
      sourcesWrapEl.style.display = "none";
      return;
    }
    for (const s of sources.slice(0, 8)) {
      const li = document.createElement("li");
      const src = s.source ?? "unknown";
      const dist = (typeof s.distance === "number") ? ` (d=${s.distance.toFixed(3)})` : "";
      li.textContent = `${src}${dist}`;
      sourcesListEl.appendChild(li);
    }
    sourcesWrapEl.style.display = "block";
  }

  function apiUrl(path) {
    const base = (apiBaseEl?.value || "").trim().replace(/\/+$/, "");
    return `${base}${path}`;
  }

  async function ask(question) {
    if (!question) return;

    // Loading “ipsum”/status
    let i = 0;
    setStatus(LOREM_LINES[i]);
    const ticker = setInterval(() => {
      i = (i + 1) % LOREM_LINES.length;
      setStatus(LOREM_LINES[i]);
    }, 800);

    setAnswer("…", "animate__fadeIn");

    try {
      const res = await fetch(apiUrl("/query"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          return_sources: !!showSourcesEl.checked
        })
      });

      const data = await res.json().catch(() => ({}));
      clearInterval(ticker);

      if (!res.ok) {
        setStatus("Error");
        setAnswer(`Error ${res.status}: ${data?.detail || "Request failed."}`, "animate__fadeIn");
        setSources([]);
        return;
      }

      setStatus("Done");
      setAnswer(String(data?.answer ?? "No answer returned."), "animate__fadeInUp");
      setSources(data?.sources ?? []);
    } catch (err) {
      clearInterval(ticker);
      setStatus("Network error");
      setAnswer(`Network error: ${err?.message || String(err)}`, "animate__fadeIn");
      setSources([]);
    }
  }

  sendEl?.addEventListener("click", () => ask((qEl?.value || "").trim()));
  qEl?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") ask((qEl?.value || "").trim());
  });

  chips.forEach((btn) => {
    btn.addEventListener("click", () => {
      const q = btn.getAttribute("data-q") || "";
      qEl.value = q;
      qEl.focus();
    });
  });
})();