/* ==========================================================================
   DriverSize — interações da landing page
   - header / menu mobile
   - navegação ativa por seção
   - carrossel de telas (setas, dots, teclado, arrastar, autoplay)
   - revelação no scroll
   - FAQ (um aberto por vez)
   ========================================================================== */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- Header ---------------- */
  const header = document.querySelector('.site-header');

  if (header) {
    const onScroll = () => header.classList.toggle('is-stuck', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------------- Menu mobile ---------------- */
  const menuBtn = document.getElementById('menuBtn');
  const nav = document.getElementById('menu');

  if (menuBtn && nav) {
    const labelOpen = menuBtn.dataset.labelOpen || 'Abrir menu';
    const labelClose = menuBtn.dataset.labelClose || 'Fechar menu';

    const closeMenu = () => {
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.setAttribute('aria-label', labelOpen);
      nav.classList.remove('is-open');
    };

    menuBtn.addEventListener('click', () => {
      const open = menuBtn.getAttribute('aria-expanded') === 'true';
      if (open) {
        closeMenu();
      } else {
        menuBtn.setAttribute('aria-expanded', 'true');
        menuBtn.setAttribute('aria-label', labelClose);
        nav.classList.add('is-open');
      }
    });

    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) closeMenu();
    });

    document.addEventListener('click', (event) => {
      if (!nav.classList.contains('is-open')) return;
      if (nav.contains(event.target) || menuBtn.contains(event.target)) return;
      closeMenu();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 960) closeMenu();
    });
  }

  /* ---------------- Link ativo conforme a seção ---------------- */
  const navLinks = Array.from(document.querySelectorAll('.site-nav a[href^="#"]'));
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    const setActive = (id) => {
      navLinks.forEach((link) => {
        const match = link.getAttribute('href') === '#' + id;
        link.classList.toggle('is-active', match);
        if (match) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    };

    const spy = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: [0, 0.2, 0.6] }
    );

    sections.forEach((section) => spy.observe(section));
  }

  /* ---------------- Revelação no scroll ---------------- */
  const reveals = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    reveals.forEach((element) => revealObserver.observe(element));
  } else {
    reveals.forEach((element) => element.classList.add('is-visible'));
  }

  /* ---------------- Carrossel ---------------- */
  const carousel = document.querySelector('[data-carousel]');

  if (carousel) {
    const track = carousel.querySelector('[data-carousel-track]');
    const viewport = carousel.querySelector('[data-carousel-viewport]');
    const dotsBox = carousel.querySelector('[data-carousel-dots]');
    const status = carousel.querySelector('[data-carousel-status]');
    const prevBtn = document.querySelector('[data-carousel-prev]');
    const nextBtn = document.querySelector('[data-carousel-next]');
    const slides = Array.from(track.querySelectorAll('[data-slide]'));
    const dotLabel = carousel.dataset.dotLabel || 'Ir para a tela {n}';
    const statusFormat = carousel.dataset.statusFormat || '{n} de {total}';

    let index = 0;
    let autoplayId = null;
    let paused = false;
    const AUTOPLAY_MS = 7000;

    // Dots
    const dots = slides.map((slide, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', dotLabel.replace('{n}', i + 1));
      if (i === 0) dot.setAttribute('aria-current', 'true');
      dot.addEventListener('click', () => {
        go(i);
        restartAutoplay();
      });
      dotsBox.appendChild(dot);
      return dot;
    });

    const centerOffset = (slide) => {
      const x = slide.offsetLeft + slide.offsetWidth / 2 - viewport.clientWidth / 2;
      return Math.max(0, Math.min(x, track.scrollWidth - viewport.clientWidth));
    };

    function render() {
      track.style.transform = 'translate3d(' + -centerOffset(slides[index]) + 'px, 0, 0)';
      slides.forEach((slide, i) => {
        slide.classList.toggle('is-active', i === index);
        slide.setAttribute('aria-hidden', i === index ? 'false' : 'true');
      });
      dots.forEach((dot, i) => {
        if (i === index) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
      if (status) {
        status.textContent = statusFormat.replace('{n}', index + 1).replace('{total}', slides.length);
      }
    }

    function go(next) {
      index = (next + slides.length) % slides.length;
      render();
    }

    prevBtn && prevBtn.addEventListener('click', () => { go(index - 1); restartAutoplay(); });
    nextBtn && nextBtn.addEventListener('click', () => { go(index + 1); restartAutoplay(); });

    // Teclado
    carousel.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); go(index - 1); restartAutoplay(); }
      if (event.key === 'ArrowRight') { event.preventDefault(); go(index + 1); restartAutoplay(); }
    });

    // Arrastar / swipe
    let dragStartX = 0;
    let dragDelta = 0;
    let dragging = false;
    let baseTransform = 0;
    let suppressClick = false;

    const currentX = () => {
      const value = track.style.transform.match(/translate3d\((-?[\d.]+)px/);
      return value ? Math.abs(parseFloat(value[1])) : centerOffset(slides[index]);
    };

    track.addEventListener('pointerdown', (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      dragging = true;
      dragStartX = event.clientX;
      dragDelta = 0;
      baseTransform = currentX();
      track.classList.add('is-dragging');
      track.setPointerCapture && track.setPointerCapture(event.pointerId);
      stopAutoplay();
    });

    track.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      dragDelta = event.clientX - dragStartX;
      track.style.transform = 'translate3d(' + (-baseTransform + dragDelta) + 'px, 0, 0)';
    });

    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      track.classList.remove('is-dragging');
      suppressClick = Math.abs(dragDelta) > 12;
      if (Math.abs(dragDelta) > 56) go(index + (dragDelta < 0 ? 1 : -1));
      else render();
      restartAutoplay();
    };

    // Evita abrir links/ampliar quando o gesto foi um arrasto
    track.addEventListener('click', (event) => {
      if (!suppressClick) return;
      suppressClick = false;
      event.preventDefault();
      event.stopPropagation();
    }, true);

    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    track.addEventListener('pointerleave', endDrag);

    // Autoplay
    function startAutoplay() {
      if (reduceMotion || paused || document.hidden) return;
      stopAutoplay();
      autoplayId = window.setInterval(() => go(index + 1), AUTOPLAY_MS);
    }
    function stopAutoplay() {
      if (autoplayId) {
        window.clearInterval(autoplayId);
        autoplayId = null;
      }
    }
    function restartAutoplay() {
      stopAutoplay();
      startAutoplay();
    }

    carousel.addEventListener('pointerenter', () => { paused = true; stopAutoplay(); });
    carousel.addEventListener('pointerleave', () => { paused = false; startAutoplay(); });
    carousel.addEventListener('focusin', () => { paused = true; stopAutoplay(); });
    carousel.addEventListener('focusout', () => { paused = false; startAutoplay(); });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopAutoplay();
      else startAutoplay();
    });

    // Resize
    let resizeFrame = null;
    window.addEventListener('resize', () => {
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(render);
    });

    render();
    startAutoplay();
  }

  /* ---------------- FAQ: um aberto por vez ---------------- */
  const faqItems = Array.from(document.querySelectorAll('.faq__item'));
  faqItems.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (!item.open) return;
      faqItems.forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });

  /* ---------------- Ano no rodapé ---------------- */
  const year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
})();
