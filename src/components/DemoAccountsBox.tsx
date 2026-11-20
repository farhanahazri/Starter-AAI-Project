"use client";
// The "Demo data" box under the login form (docs/specs/01-requirements.md
// U9/AC-09; interview: show demo logins). The six emails are the fixed
// Reference B list from the design spec, not a database read — this is a
// workshop aid for the login page only. Clicking an email fills the form.

const DEMO_EMAILS = [
  "employee-1@budiman.com",
  "supervisor-1@budiman.com",
  "supervisor-2@budiman.com",
  "hr-1@budiman.com",
  "hr-2@budiman.com",
  "admin@budiman.com",
];

export default function DemoAccountsBox() {
  const fill = (email: string) => {
    const input = document.querySelector<HTMLInputElement>('input[name="email"]');
    if (input) input.value = email;
  };

  return (
    <aside
      aria-label="Demo data"
      className="mx-auto mt-6 w-full max-w-sm rounded-lg border border-dashed border-gray-400 bg-gray-100 p-4 text-sm"
    >
      <p className="font-semibold text-gray-700">Demo data</p>
      <p className="mt-1 text-gray-600">
        Workshop accounts — any email below with the password{" "}
        <code className="rounded bg-gray-200 px-1">password123</code>.
      </p>
      <ul className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
        {DEMO_EMAILS.map((email) => (
          <li key={email}>
            <button
              type="button"
              onClick={() => fill(email)}
              className="text-blue-700 underline hover:text-blue-900"
            >
              {email}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
