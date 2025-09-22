# Manual Testing – Newsletter Signup

These steps verify the new newsletter signup handler and footer form wiring.

## Prerequisites

- Ensure the Gmail service account configuration used elsewhere in the project is valid so that `sendEmail` can send mail.
- Set `NEWSLETTER_TARGET_EMAIL` (and optionally `NEWSLETTER_FORWARD_SUBJECT`) in your environment before starting the Next.js dev server. The address should be a mailbox you control for verification.

## Test Steps

1. Run the development server with `npm run dev`.
2. Visit `http://localhost:3000` in a browser and scroll to the footer.
3. Enter a valid email address (for example, `subscriber@example.com`) and submit the form.
   - The button is disabled while the request is processed.
   - A green success message appears when the API responds with `200 OK`.
   - An email is delivered to the configured `NEWSLETTER_TARGET_EMAIL` inbox containing the subscriber address and timestamp.
4. Refresh the page and submit the form with an empty field to confirm client-side validation shows an inline error.
5. Submit the form with an invalid value such as `not-an-email` and verify the red error message appears without making a network request.
6. Temporarily remove or change `NEWSLETTER_TARGET_EMAIL` so the API returns an error, then submit a valid email again and confirm a red error message informs the user of the failure.

Document the test results in your release notes or issue tracker so future regressions can be caught quickly.
