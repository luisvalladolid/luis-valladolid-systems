(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const motionButton = $('#motion-toggle');
  const hero = $('.hero-art');
  const timers = new Set();
  let manualPause = false;
  let demoRunning = false;
  let scrollFrame = 0;
  let copyTimer;

  try {
    manualPause = localStorage.getItem('lv-motion') === 'paused';
  } catch (_) { /* The experience also works when storage is unavailable. */ }

  const motionPaused = () => reducedMotion.matches || manualPause;
  const setLabel = (button, selector, value) => {
    if (button) (button.querySelector(selector) || button).textContent = value;
  };

  function resetPointerEffects() {
    hero?.style.setProperty('--pointer-x', '0deg');
    hero?.style.setProperty('--pointer-y', '0deg');
    $$('.magnetic').forEach((button) => {
      button.style.setProperty('--mx', '0px');
      button.style.setProperty('--my', '0px');
    });
  }
  function syncMotion() {
    const paused = motionPaused();
    document.body.classList.toggle('motion-paused', paused);
    document.documentElement.style.scrollBehavior = paused ? 'auto' : '';
    if (motionButton) {
      motionButton.setAttribute('aria-pressed', String(paused));
      motionButton.disabled = reducedMotion.matches;
      motionButton.title = reducedMotion.matches
        ? 'Reduced motion is enabled in your device settings'
        : paused ? 'Enable animation' : 'Pause animation';
      setLabel(motionButton, '[data-motion-label]', paused ? 'Motion off' : 'Motion on');
    }
    if (paused) {
      resetPointerEffects();
      if (demoRunning) completeDemo();
    }
  }
  motionButton?.addEventListener('click', () => {
    manualPause = !manualPause;
    try { localStorage.setItem('lv-motion', manualPause ? 'paused' : 'playing'); } catch (_) {}
    syncMotion();
  });
  reducedMotion.addEventListener('change', syncMotion);
  finePointer.addEventListener('change', resetPointerEffects);

  // Mobile navigation remains ordinary anchor navigation, including deep links.
  const menuButton = $('#menu-toggle');
  const navigation = $('#main-nav');
  function closeMenu(returnFocus = false) {
    if (!menuButton || !navigation) return;
    const wasOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('is-open');
    if (wasOpen && returnFocus) menuButton.focus();
  }
  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    navigation?.classList.toggle('is-open', open);
  });
  navigation?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => closeMenu()));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu(true);
  });
  document.addEventListener('click', (event) => {
    if (!navigation?.contains(event.target) && !menuButton?.contains(event.target)) closeMenu();
  });
  window.matchMedia('(min-width: 720px)').addEventListener('change', (event) => {
    if (event.matches) closeMenu();
  });

  const progress = $('#scroll-progress');
  const header = $('.header');
  function updateScroll() {
    scrollFrame = 0;
    const distance = document.documentElement.scrollHeight - window.innerHeight;
    const amount = distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0;
    if (progress) progress.style.transform = `scaleX(${amount})`;
    header?.classList.toggle('is-scrolled', window.scrollY > 24);
  }
  function scheduleScroll() {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
  }
  window.addEventListener('scroll', scheduleScroll, { passive: true });
  window.addEventListener('resize', scheduleScroll, { passive: true });
  window.addEventListener('load', scheduleScroll, { once: true });
  updateScroll();

  // Content is visible by default; reveal styling only activates after setup.
  const revealElements = $$('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
    revealElements.forEach((element) => {
      if (element.getBoundingClientRect().top < window.innerHeight || motionPaused()) {
        element.classList.add('is-visible');
      } else {
        revealObserver.observe(element);
      }
    });
  } else {
    revealElements.forEach((element) => element.classList.add('is-visible'));
  }

  const systemButton = $('#system-toggle');
  const systemStatus = $('#system-status');
  systemButton?.addEventListener('click', () => {
    const connected = systemButton.getAttribute('aria-pressed') !== 'true';
    systemButton.setAttribute('aria-pressed', String(connected));
    hero?.classList.toggle('is-connected', connected);
    setLabel(systemButton, '[data-system-label]', connected ? 'Disconnect system' : 'Connect the system');
    if (systemStatus) systemStatus.textContent = connected
      ? 'Connected. Every step has a clear path forward.'
      : 'Disconnected. The pieces are here. The connection is missing.';
  });
  hero?.addEventListener('pointermove', (event) => {
    if (motionPaused() || !finePointer.matches || event.pointerType === 'touch') return;
    const bounds = hero.getBoundingClientRect();
    hero.style.setProperty('--pointer-x', `${((event.clientX - bounds.left) / bounds.width - 0.5) * 8}deg`);
    hero.style.setProperty('--pointer-y', `${-((event.clientY - bounds.top) / bounds.height - 0.5) * 8}deg`);
  }, { passive: true });
  hero?.addEventListener('pointerleave', resetPointerEffects);
  $$('.magnetic').forEach((button) => {
    button.addEventListener('pointermove', (event) => {
      if (motionPaused() || !finePointer.matches || event.pointerType === 'touch') return;
      const bounds = button.getBoundingClientRect();
      button.style.setProperty('--mx', `${((event.clientX - bounds.left) / bounds.width - 0.5) * 6}px`);
      button.style.setProperty('--my', `${((event.clientY - bounds.top) / bounds.height - 0.5) * 6}px`);
    }, { passive: true });
    button.addEventListener('pointerleave', () => {
      button.style.setProperty('--mx', '0px');
      button.style.setProperty('--my', '0px');
    });
  });

  const demos = {
    leads: {
      label: 'FROM INTEREST TO ACTION',
      heading: 'Make every lead<br>the start of something.',
      steps: [
        ['A new inquiry arrives', 'A prospect fills out your form.'],
        ['Your CRM gets updated', 'The details reach the right place.'],
        ['Follow-up is ready', 'Your team knows what to do next.'],
      ],
    },
    onboard: {
      label: 'FROM YES TO GETTING STARTED',
      heading: 'Give every client<br>a thoughtful welcome.',
      steps: [
        ['A deal is marked won', 'A new client is ready to begin.'],
        ['The handoff begins', 'Project details reach your team.'],
        ['Onboarding moves forward', 'Tasks and next steps are clear.'],
      ],
    },
    ops: {
      label: 'FROM SCATTERED TO IN SYNC',
      heading: 'Keep the details<br>moving together.',
      steps: [
        ['Work needs attention', 'A project reaches a key stage.'],
        ['The right people know', 'A notification prompts action.'],
        ['Progress stays visible', 'Your team can see what happens next.'],
      ],
    },
  };
  const tabs = $$('[data-demo]');
  const demoPanel = $('#demo-panel');
  const flowSteps = $$('.flow-step');
  const runButton = $('#run-demo');
  const runStatus = $('#run-status');
  function clearDemoTimers() {
    timers.forEach((timer) => window.clearTimeout(timer));
    timers.clear();
  }
  function later(callback, delay) {
    const timer = window.setTimeout(() => { timers.delete(timer); callback(); }, delay);
    timers.add(timer);
  }
  function resetDemo() {
    clearDemoTimers();
    demoRunning = false;
    flowSteps.forEach((step) => step.classList.remove('is-active', 'is-complete'));
    demoPanel?.classList.remove('is-running', 'is-complete');
    if (runButton) {
      runButton.disabled = false;
      runButton.setAttribute('aria-busy', 'false');
      setLabel(runButton, '[data-run-label]', 'Run workflow');
    }
    if (runStatus) runStatus.textContent = 'Ready when you are.';
  }
  function completeDemo() {
    clearDemoTimers();
    demoRunning = false;
    flowSteps.forEach((step) => {
      step.classList.remove('is-active');
      step.classList.add('is-complete');
    });
    demoPanel?.classList.remove('is-running');
    demoPanel?.classList.add('is-complete');
    if (runButton) {
      runButton.disabled = false;
      runButton.setAttribute('aria-busy', 'false');
      setLabel(runButton, '[data-run-label]', 'Replay workflow');
    }
    if (runStatus) runStatus.textContent = 'Demo complete. Three connected steps. One clear way forward.';
  }
  function showStep(index) {
    flowSteps.forEach((step) => {
      const position = Number(step.dataset.step);
      step.classList.toggle('is-active', position === index);
      step.classList.toggle('is-complete', position < index);
    });
  }
  function selectTab(tab, focus = false) {
    const data = demos[tab.dataset.demo];
    if (!data) return;
    resetDemo();
    tabs.forEach((candidate) => {
      const active = candidate === tab;
      candidate.setAttribute('aria-selected', String(active));
      candidate.tabIndex = active ? 0 : -1;
    });
    demoPanel?.setAttribute('aria-labelledby', tab.id);
    if ($('#demo-label')) $('#demo-label').textContent = data.label;
    // These strings are fixed local content; no visitor input enters this markup.
    if ($('#demo-heading')) $('#demo-heading').innerHTML = data.heading;
    data.steps.forEach(([title, description], index) => {
      const titleElement = $(`#step${index + 1}`);
      const descriptionElement = $(`#desc${index + 1}`);
      if (titleElement) titleElement.textContent = title;
      if (descriptionElement) descriptionElement.textContent = description;
    });
    if (focus) tab.focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', (event) => {
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + tabs.length - 1) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      selectTab(tabs[next], true);
    });
  });
  runButton?.addEventListener('click', () => {
    if (demoRunning) return;
    resetDemo();
    demoRunning = true;
    runButton.disabled = true;
    runButton.setAttribute('aria-busy', 'true');
    setLabel(runButton, '[data-run-label]', 'Workflow running…');
    demoPanel?.classList.add('is-running');
    if (runStatus) runStatus.textContent = 'Running an illustrative workflow…';
    if (motionPaused()) { completeDemo(); return; }
    showStep(0);
    later(() => showStep(1), 850);
    later(() => showStep(2), 1700);
    later(completeDemo, 2550);
  });

  // The clock illustrates the existing 24-hour follow-up rule without sending anything.
  const approvalTime = $('#approval-time');
  function updateApproval() {
    if (!approvalTime) return;
    const hours = Math.max(0, Math.min(24, Number(approvalTime.value) || 0));
    const triggered = hours >= 24;
    const timeValue = $('#time-value');
    const state = $('#approval-state');
    const detail = $('#approval-detail');
    const track = $('#approval-track');
    if (timeValue) timeValue.textContent = `${String(hours).padStart(2, '0')}h`;
    if (state) state.textContent = triggered ? 'Follow-up triggered' : 'Awaiting approval';
    const detailText = triggered
      ? 'No approval after 24 hours: an email prompts the assignee to choose another service member.'
      : 'The assignment is waiting for approval. If no approval arrives within 24 hours, the follow-up begins.';
    if (detail && detail.textContent !== detailText) detail.textContent = detailText;
    track?.style.setProperty('--elapsed', `${hours / 24 * 100}%`);
    track?.classList.toggle('is-complete', triggered);
    $('.approval-demo')?.classList.toggle('is-complete', triggered);
    $('.clock-visual')?.style.setProperty('--clock-angle', `${hours / 24 * 360}deg`);
    approvalTime.setAttribute('aria-valuetext', `${hours} hours elapsed. ${triggered ? 'Follow-up triggered' : 'Awaiting approval'}.`);
  }
  approvalTime?.addEventListener('input', updateApproval);
  $('#advance-clock')?.addEventListener('click', () => {
    if (approvalTime) approvalTime.value = '24';
    updateApproval();
  });
  $('#reset-clock')?.addEventListener('click', () => {
    if (approvalTime) approvalTime.value = '0';
    updateApproval();
  });
  updateApproval();

  const copyButton = $('#copy-email');
  copyButton?.addEventListener('click', async () => {
    const originalLabel = copyButton.dataset.originalLabel || copyButton.textContent;
    copyButton.dataset.originalLabel = originalLabel;
    window.clearTimeout(copyTimer);
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText('luissvallaa@gmail.com');
      copyButton.textContent = 'Email copied';
      copyTimer = window.setTimeout(() => { copyButton.textContent = originalLabel; }, 2500);
    } catch (_) { window.location.href = 'mailto:luissvallaa@gmail.com'; }
  });

  // Finish transient states before a page is cached or backgrounded.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && demoRunning) completeDemo();
  });
  window.addEventListener('pagehide', () => {
    clearDemoTimers();
    window.clearTimeout(copyTimer);
    if (scrollFrame) cancelAnimationFrame(scrollFrame);
    scrollFrame = 0;
    resetPointerEffects();
  });
  window.addEventListener('pageshow', () => {
    if (demoRunning) completeDemo();
    updateScroll();
  });

  syncMotion();
  document.body.classList.add('is-ready');
})();
