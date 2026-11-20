// The `?next` open-redirect guard (docs/specs/02-design.md rule 5, AC-05).
// A login may only return you to an internal path: it must start with a
// single "/", never "//" (protocol-relative like //evil.example) and never
// "/\" (browsers read /\evil.example as //evil.example too). Pure — unit
// testable without Next.

export function isSafeNext(value: string): boolean {
  return /^\/(?!\/|\\)/.test(value);
}
