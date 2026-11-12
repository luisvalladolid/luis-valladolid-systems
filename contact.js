const auditForm = document.getElementById('audit-form');
const formStatus = document.getElementById('form-status');
const submitButton = auditForm.querySelector('[type="submit"]');
const webhookUrl = '/api/submit-audit';
let isSubmitting = false;
let pendingSubmissionId = null;

function setStatus(message, type = '') {
  formStatus.textContent = message;
  formStatus.className = `form-status ${type}`.trim();
}

function setSubmitting(submitting) {
  isSubmitting = submitting;
  submitButton.disabled = submitting;
  submitButton.setAttribute('aria-busy', String(submitting));
  submitButton.innerHTML = submitting
    ? 'Sending your audit request…'
    : 'Get My Free Automation Audit <span aria-hidden="true">↗</span>';
}

function setTrackingFields() {
  const params = new URLSearchParams(window.location.search);
  auditForm.elements['utm-source'].value = params.get('utm_source') || '';
  auditForm.elements['utm-medium'].value = params.get('utm_medium') || '';
  auditForm.elements['utm-campaign'].value = params.get('utm_campaign') || '';
  auditForm.elements['landing-page-url'].value = window.location.href;
}

setTrackingFields();

auditForm.addEventListener('input', () => {
  if (!isSubmitting) pendingSubmissionId = null;
});

auditForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus('');

  if (isSubmitting) return;

  if (!auditForm.checkValidity()) {
    const firstInvalid = auditForm.querySelector(':invalid');
    setStatus('Please complete the required fields and check the URL or email format.', 'error');
    firstInvalid.focus();
    auditForm.reportValidity();
    return;
  }

  setTrackingFields();
  const formData = new FormData(auditForm);
  if (formData.get('website-check')) {
    setStatus('Thanks! Your request was received.', 'success');
    auditForm.reset();
    setTrackingFields();
    pendingSubmissionId = null;
    return;
  }
  pendingSubmissionId ||= crypto.randomUUID();
  const submittedAt = new Date().toISOString();
  const payload = {
    'Submission ID': pendingSubmissionId,
    submission_id: pendingSubmissionId,
    submitted_at: submittedAt,
    consent_to_contact: formData.get('consent-to-contact') === 'on',
    form_version: 'lead-intake-v2',
    website_check: '',
    'Full Name': formData.get('full-name'),
    'Work Email': formData.get('work-email'),
    Company: formData.get('company'),
    'Company Website': formData.get('company-website'),
    'Process they want to automate': formData.get('process'),
    'Tools involved': formData.get('tools'),
    // Retain the original field name used by the existing Make mapping.
    'Tools they currently use': formData.get('tools'),
    'Weekly time': formData.get('weekly-time'),
    'Automation timeline': formData.get('automation-timeline'),
    'Estimated budget': formData.get('estimated-budget'),
    'LinkedIn URL': formData.get('linkedin-url'),
    'Lead Source': formData.get('lead-source'),
    'Conversion Point': formData.get('conversion-point'),
    'UTM Source': formData.get('utm-source'),
    'UTM Medium': formData.get('utm-medium'),
    'UTM Campaign': formData.get('utm-campaign'),
    'Landing Page URL': formData.get('landing-page-url'),
    // Preserve existing Make/HubSpot mappings while they are being expanded.
    Source: 'Website',
    Status: 'New',
    'Submitted Date': submittedAt,
  };

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);
  setSubmitting(true);
  setStatus('Sending your audit request…');

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`Webhook responded with ${response.status}`);

    auditForm.reset();
    setTrackingFields();
    pendingSubmissionId = null;
    setStatus('Thanks! I’ll review your workflow and get back to you with automation opportunities.', 'success');
    formStatus.focus();
  } catch (error) {
    setStatus('Your request could not be sent. Please try again, or email Luis directly at luissvallaa@gmail.com.', 'error');
  } finally {
    window.clearTimeout(timeout);
    setSubmitting(false);
  }
});

