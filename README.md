# Luis Valladolid Systems

A landing page showcasing Luis Valladolid’s automation, data and software services, with an audit request form.

**Live ChatGPT Site:** https://luis-valladolid-systems.luissvallaa.chatgpt.site/

## Files

- `index.html` — page content and structure
- `style.css` — styling
- `interaction.js` — interactive demos, navigation, and motion
- `contact.js` — audit request form logic
- `luis-valladolid-resume.pdf` — downloadable résumé
- `netlify/functions/` — server-side audit submission proxy for Netlify

## Local preview

Run `python -m http.server 8000` and open `http://localhost:8000`. The audit form requires the Netlify function and its configured server-side endpoint; a basic local file server cannot send submissions.

The ChatGPT Site and this GitHub repository have separate hosting and form endpoints. Changes made here do not automatically publish the ChatGPT Site.
