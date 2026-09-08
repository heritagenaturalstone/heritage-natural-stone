/* Heritage Natural Stone — one-page pilot interactions */
(function () {
  "use strict";

  /* QA hook: ?noanim renders everything instantly */
  if (location.search.indexOf("noanim") !== -1) {
    document.documentElement.classList.add("no-anim");
  }

  var bar = document.getElementById("siteBar");
  var barBrand = document.getElementById("barBrand");
  var hero = document.getElementById("top");
  var heroBrand = document.getElementById("heroBrand");
  var heroSlogan = document.getElementById("heroSlogan");
  var menuToggle = document.getElementById("menuToggle");
  var mobileMenu = document.getElementById("mobileMenu");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var noAnim = document.documentElement.classList.contains("no-anim");

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* --- Bar: shadow when stuck + theme follows the section under it --- */
  var themedSections = Array.prototype.slice.call(
    document.querySelectorAll("[data-header-theme]")
  );

  function updateBarTheme() {
    var rect = bar.getBoundingClientRect();
    bar.classList.toggle("is-stuck", rect.top <= 0);
    var probe = rect.top + rect.height * 0.5;
    var theme = "light";
    for (var i = 0; i < themedSections.length; i++) {
      var r = themedSections[i].getBoundingClientRect();
      if (r.top <= probe && r.bottom >= probe) {
        theme = themedSections[i].getAttribute("data-header-theme");
        break;
      }
    }
    bar.classList.toggle("is-dark", theme === "dark");
  }

  /* --- Hero logo choreography (desktop, motion allowed) ---
     The big centred logo shrinks while it flies into the empty brand slot
     of the bar; once seated, the bar's own (dark) logo takes over. */
  var fancyLogo =
    !noAnim &&
    !reduceMotion.matches &&
    window.matchMedia("(min-width: 901px)").matches;

  var logoBase = null; /* measured static geometry */

  function measureLogo() {
    /* measure in static flow: park the logo back where the spacer sits */
    var spacer = document.getElementById("heroBrandSpacer");
    heroBrand.style.transform = "";
    heroBrand.style.position = "";
    if (spacer) spacer.parentNode.removeChild(spacer);
    var r = heroBrand.getBoundingClientRect();
    logoBase = {
      w: r.width,
      h: r.height,
      cx: r.left + r.width / 2,
      cy: r.top + r.height / 2 + window.scrollY
    };
    /* reserve the logo's spot so the slogan doesn't jump when it goes fixed */
    spacer = document.createElement("div");
    spacer.id = "heroBrandSpacer";
    spacer.style.width = r.width + "px";
    spacer.style.height = r.height + "px";
    heroBrand.parentNode.insertBefore(spacer, heroBrand);
    heroBrand.style.position = "fixed";
    heroBrand.style.left = "0";
    heroBrand.style.top = "0";
    heroBrand.style.transformOrigin = "0 0";
    heroBrand.style.zIndex = "901";
  }

  function updateLogo() {
    if (!fancyLogo || !logoBase) return;
    var heroH = hero.offsetHeight;
    var y = window.scrollY;
    var p = clamp01(y / heroH);
    var e = p * p * (3 - 2 * p); /* smoothstep */

    if (p >= 1) {
      heroBrand.style.visibility = "hidden";
      barBrand.classList.remove("is-waiting");
      return;
    }
    heroBrand.style.visibility = "";
    barBrand.classList.add("is-waiting");

    var target = barBrand.getBoundingClientRect();
    var tCx = target.left + target.width / 2;
    var tCy = target.top + target.height / 2;
    var s = lerp(1, target.height / logoBase.h, e);
    var cx = lerp(logoBase.cx, tCx, e);
    var cy = lerp(logoBase.cy - y, tCy, e);
    heroBrand.style.transform =
      "translate(" + (cx - (logoBase.w * s) / 2) + "px," +
      (cy - (logoBase.h * s) / 2) + "px) scale(" + s + ")";
    heroSlogan.style.opacity = String(clamp01(1 - p / 0.35));
  }

  if (fancyLogo) {
    measureLogo();
    barBrand.classList.add("is-waiting");
    window.addEventListener("resize", function () {
      measureLogo();
      updateLogo();
    });
    /* fonts/layout settle after load — measure again */
    window.addEventListener("load", function () {
      measureLogo();
      updateLogo();
    });
  }

  /* --- Floating contact buttons: only after the bar has become the header --- */
  function updateRail() {
    document.body.classList.toggle(
      "past-hero",
      window.scrollY >= hero.offsetHeight - 4
    );
  }

  /* hide the rail while the contact section (with its own CTAs) is on screen */
  var contactSection = document.getElementById("contact");
  if (contactSection && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        document.body.classList.toggle("in-contact", entry.isIntersecting);
      });
    }, { threshold: 0.2 }).observe(contactSection);
  }

  function onScroll() {
    updateBarTheme();
    updateLogo();
    updateRail();
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* --- Mobile menu --- */
  function closeMenu() {
    menuToggle.classList.remove("is-open");
    mobileMenu.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    mobileMenu.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  menuToggle.addEventListener("click", function () {
    var open = !mobileMenu.classList.contains("is-open");
    menuToggle.classList.toggle("is-open", open);
    mobileMenu.classList.toggle("is-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    mobileMenu.setAttribute("aria-hidden", String(!open));
    document.body.style.overflow = open ? "hidden" : "";
  });
  mobileMenu.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", closeMenu);
  });

  /* --- Smooth in-page anchor scrolling ---
     Native smooth scrolling (CSS or scrollIntoView) is silently dropped by
     Chrome in some environments, so anchors run their own rAF animation. */
  var scrollAnim = null;

  function animateScrollTo(targetY) {
    /* rAF never fires in hidden/background tabs — jump straight there */
    if (document.visibilityState === "hidden") {
      window.scrollTo(0, targetY);
      return;
    }
    var startY = window.scrollY;
    var dist = targetY - startY;
    var duration = Math.min(1100, 350 + Math.abs(dist) * 0.25);
    var t0 = performance.now();
    var started = false;
    if (scrollAnim) cancelAnimationFrame(scrollAnim);

    function step(now) {
      started = true;
      var t = clamp01((now - t0) / duration);
      var e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      window.scrollTo(0, startY + dist * e);
      if (t < 1) scrollAnim = requestAnimationFrame(step);
      else scrollAnim = null;
    }
    scrollAnim = requestAnimationFrame(step);
    /* watchdog: if no frame arrives (throttled tab), finish instantly */
    setTimeout(function () {
      if (!started && scrollAnim) {
        cancelAnimationFrame(scrollAnim);
        scrollAnim = null;
        window.scrollTo(0, targetY);
      }
    }, 250);
  }

  /* a wheel/touch from the user cancels the animation */
  ["wheel", "touchstart"].forEach(function (ev) {
    window.addEventListener(ev, function () {
      if (scrollAnim) { cancelAnimationFrame(scrollAnim); scrollAnim = null; }
    }, { passive: true });
  });

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("href").slice(1);
      var target = id && document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      var barH = bar.offsetHeight;
      var maxY = document.documentElement.scrollHeight - window.innerHeight;
      var targetY = Math.min(
        maxY,
        Math.max(0, target.getBoundingClientRect().top + window.scrollY - barH)
      );
      if (reduceMotion.matches || noAnim) window.scrollTo(0, targetY);
      else animateScrollTo(targetY);
      if (history.pushState) history.pushState(null, "", "#" + id);
    });
  });

  /* --- Team: switch between first and second photo --- */
  document.querySelectorAll(".member__media").forEach(function (media) {
    var btn = media.querySelector(".member__next");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var showingAlt = media.classList.toggle("show-alt");
      btn.setAttribute(
        "aria-label",
        showingAlt ? "Show previous photo" : "Show next photo"
      );
    });
  });

  /* --- Lazy backgrounds: feature photos load as the grid approaches --- */
  var lazyBgs = document.querySelectorAll("[data-bg]");
  function loadBg(el) {
    el.style.backgroundImage = "url('" + el.getAttribute("data-bg") + "')";
    el.removeAttribute("data-bg");
  }
  if ("IntersectionObserver" in window) {
    var bgObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { loadBg(entry.target); bgObserver.unobserve(entry.target); }
      });
    }, { rootMargin: "500px 0px" });
    lazyBgs.forEach(function (el) { bgObserver.observe(el); });
  } else {
    lazyBgs.forEach(loadBg);
  }

  /* --- Intro reel: fetch only when near, play only while on screen --- */
  var reel = document.getElementById("introReel");
  function armReel() {
    if (!reel || reel.getAttribute("src")) return;
    reel.setAttribute("src", reel.getAttribute("data-src"));
    reel.preload = "auto";
    reel.load();
  }
  if (reel) {
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { armReel(); obs.disconnect(); }
        });
      }, { rootMargin: "700px 0px" }).observe(reel);
    } else {
      armReel();
    }
  }

  /* belt and braces: a plain scroll check also feeds the lazy loaders
     (covers browsers/tabs where observers are throttled) */
  function lazyCheck() {
    var limit = window.innerHeight + 700;
    document.querySelectorAll("[data-bg]").forEach(function (el) {
      if (el.getBoundingClientRect().top < limit) loadBg(el);
    });
    if (reel && !reel.getAttribute("src") &&
        reel.getBoundingClientRect().top < limit) {
      armReel();
    }
  }
  window.addEventListener("scroll", lazyCheck, { passive: true });
  lazyCheck();

  if (reel) {
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              armReel();
              var p = reel.play();
              if (p && p.catch) p.catch(function () {});
            } else {
              reel.pause();
            }
          });
        },
        { threshold: 0.3 }
      ).observe(reel);
    } else {
      var p = reel.play();
      if (p && p.catch) p.catch(function () {});
    }
  }

  /* --- Reveal on scroll --- */
  if ("IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".reveal").forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* --- Active nav link by section --- */
  var sections = ["who-we-are", "what-we-do", "our-values", "contact"]
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);
  var navLinks = document.querySelectorAll(".nav__link");

  if ("IntersectionObserver" in window && sections.length) {
    var sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          navLinks.forEach(function (link) {
            link.classList.toggle(
              "is-active",
              link.getAttribute("href") === "#" + entry.target.id
            );
          });
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    sections.forEach(function (s) { sectionObserver.observe(s); });
  }

  /* ============================================================
     GSAP motion layer (scrolltelling choreography)
     html.gsap-motion is set pre-paint; removed here if GSAP failed
     to load so no content can stay hidden.
     ============================================================ */
  var motionOn = document.documentElement.classList.contains("gsap-motion");
  if (motionOn && !(window.gsap && window.ScrollTrigger)) {
    document.documentElement.classList.remove("gsap-motion");
    motionOn = false;
  }

  if (motionOn) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    var desktopMotion =
      window.matchMedia("(min-width: 901px)").matches ||
      location.search.indexOf("forcedesktop") !== -1; /* QA hook */

    /* --- 1. Hero entrance: brand, slogan, then the bar rises --- */
    if (window.scrollY < 40) {
      gsap.timeline({ defaults: { ease: "power3.out" } })
        .fromTo(".hero__mark", { autoAlpha: 0, y: 26 },
                { autoAlpha: 1, y: 0, duration: 0.9 }, 0.15)
        .fromTo(".hero__word", { autoAlpha: 0, y: 26 },
                { autoAlpha: 1, y: 0, duration: 0.9 }, 0.3)
        .fromTo(".hero__slogan", { autoAlpha: 0, y: 18 },
                { autoAlpha: 1, y: 0, duration: 0.8 }, 0.65)
        .to(".bar", { y: 0, duration: 0.8, ease: "power3.out" }, 0.5);
    } else {
      gsap.set([".hero__mark", ".hero__word", ".hero__slogan"], { autoAlpha: 1 });
      gsap.set(".bar", { y: 0 });
    }

    /* --- 2. Our Team: pinned frame, members arrive one by one,
           then all three float away upward (client-specified) --- */
    if (desktopMotion) {
      gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: {
          trigger: "#our-team",
          start: function () { return "top " + bar.offsetHeight; },
          end: "+=160%",
          pin: true,
          scrub: 0.6,
          anticipatePin: 1
        }
      })
        .from(".team__grid .member:nth-child(1)", { autoAlpha: 0, y: 80, duration: 1 })
        .from(".team__grid .member:nth-child(2)", { autoAlpha: 0, y: 80, duration: 1 }, "-=0.55")
        .from(".team__grid .member:nth-child(3)", { autoAlpha: 0, y: 80, duration: 1 }, "-=0.55")
        .from(".team__line", { autoAlpha: 0, y: 26, duration: 0.7 }, "-=0.3")
        .to({}, { duration: 0.5 }) /* readable hold */
        .to(["#our-team .team__grid", "#our-team .team__line"],
            { autoAlpha: 0, y: -60, duration: 0.9, ease: "power3.in" });
    } else {
      /* mobile: the hero eases away as you scroll off it */
      gsap.to(".hero__stage", {
        yPercent: -14, autoAlpha: 0.2, ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true }
      });

      /* mobile: each member card rises while its photo develops open */
      gsap.utils.toArray(".team__grid .member").forEach(function (m) {
        var media = m.querySelector(".member__media");
        gsap.timeline({
          defaults: { ease: "power3.out" },
          scrollTrigger: { trigger: m, start: "top 85%" }
        })
          .from(m, { autoAlpha: 0, y: 56, duration: 0.8 })
          .fromTo(media,
            { clipPath: "inset(0% 0% 100% 0%)" },
            { clipPath: "inset(0% 0% 0% 0%)", duration: 0.9 }, 0.1);
      });
      gsap.from(".team__line", {
        autoAlpha: 0, y: 24, duration: 0.6, ease: "power3.out",
        scrollTrigger: { trigger: ".team__line", start: "top 92%" }
      });
    }

    /* --- 3. What We Do: title rises, video curtain-reveals + drifts --- */
    gsap.from("#what-we-do .kicker", {
      autoAlpha: 0, y: 24, duration: 0.6, ease: "power3.out",
      scrollTrigger: { trigger: "#what-we-do", start: "top 72%" }
    });
    gsap.from("#what-we-do .section__title", {
      autoAlpha: 0, y: 44, duration: 0.9, ease: "power3.out",
      scrollTrigger: { trigger: "#what-we-do", start: "top 72%" }
    });
    gsap.fromTo(".wwd__video",
      { clipPath: "inset(100% 0% 0% 0%)" },
      {
        clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, ease: "power3.inOut",
        scrollTrigger: { trigger: ".wwd__video", start: "top 82%" }
      });
    gsap.to(".wwd__video", {
      y: desktopMotion ? -36 : -18, ease: "none",
      scrollTrigger: {
        trigger: ".wwd__block", start: "top bottom", end: "bottom top", scrub: true
      }
    });
    gsap.from(".wwd__block--reverse .wwd__media", {
      autoAlpha: 0, y: 50, duration: 0.9, ease: "power3.out",
      scrollTrigger: { trigger: ".wwd__block--reverse", start: "top 78%" }
    });
    gsap.from(".wwd__block--reverse .section__text", {
      autoAlpha: 0, y: 34, duration: 0.9, ease: "power3.out", delay: 0.12,
      scrollTrigger: { trigger: ".wwd__block--reverse", start: "top 78%" }
    });

    /* --- 4. Feature grid: cards rise cell by cell --- */
    gsap.utils.toArray(".fcell").forEach(function (cell, i) {
      gsap.from(cell.querySelector(".fcell__card"), {
        autoAlpha: 0, y: 44, duration: 0.8, ease: "power3.out",
        delay: (i % 2) * 0.12,
        scrollTrigger: { trigger: cell, start: "top 80%" }
      });
      if (!desktopMotion) {
        /* mobile: the whole photo cell unclips as it enters */
        gsap.fromTo(cell,
          { clipPath: "inset(8% 6% 8% 6%)", autoAlpha: 0.35 },
          {
            clipPath: "inset(0% 0% 0% 0%)", autoAlpha: 1,
            duration: 0.9, ease: "power3.out",
            scrollTrigger: { trigger: cell, start: "top 84%" }
          });
      }
    });

    /* --- 5. Our Values: the manifesto darkens word by word with scroll --- */
    var valuesText = document.querySelector(".values__text");
    if (valuesText) {
      valuesText.innerHTML = valuesText.textContent.trim().split(/\s+/)
        .map(function (w) { return '<span class="w">' + w + "</span>"; })
        .join(" ");
      gsap.fromTo(".values__text .w",
        { opacity: 0.28 },
        {
          opacity: 1, stagger: 0.035, ease: "none",
          scrollTrigger: {
            trigger: ".values", start: "top 72%", end: "center 42%", scrub: true
          }
        });
    }

    /* --- 6. Contact: statement, buttons, then the preset rows cascade --- */
    gsap.from(".close__title", {
      autoAlpha: 0, y: 44, duration: 0.85, ease: "power3.out",
      scrollTrigger: { trigger: "#contact", start: "top 72%" }
    });
    gsap.from(".close__actions", {
      autoAlpha: 0, y: 26, duration: 0.7, delay: 0.15, ease: "power3.out",
      scrollTrigger: { trigger: "#contact", start: "top 72%" }
    });
    gsap.from(".close__right .close__ask", {
      autoAlpha: 0, y: 26, duration: 0.7, ease: "power3.out",
      scrollTrigger: { trigger: ".close__right", start: "top 78%" }
    });
    gsap.from(".presets__row", {
      autoAlpha: 0, y: 22, duration: 0.55, stagger: 0.07, ease: "power3.out",
      scrollTrigger: { trigger: ".presets", start: "top 82%" }
    });

    /* --- 7. Stats count up when they enter (25 / 2,000+ / <24h) --- */
    document.querySelectorAll(".stats__num").forEach(function (el) {
      var raw = el.textContent;
      var num = parseInt(raw.replace(/[^0-9]/g, ""), 10);
      if (!num) return;
      var prefix = raw.indexOf("<") !== -1 ? "<" : "";
      var suffix = raw.indexOf("+") !== -1 ? "+" : raw.indexOf("h") !== -1 ? "h" : "";
      var state = { n: 0 };
      gsap.to(state, {
        n: num, duration: 1.6, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
        onUpdate: function () {
          el.textContent =
            prefix + Math.round(state.n).toLocaleString("en-US") + suffix;
        }
      });
    });

    /* layout settles after fonts/images: recalc trigger positions */
    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  }

  /* --- Footer year --- */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
