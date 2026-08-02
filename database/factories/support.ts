/**
 * Only the slice of faker these helpers touch, typed here rather than imported.
 * Faker arrives through Lucid's factory callback and is not a direct dependency
 * of this project, so its own types are not resolvable from here.
 */
type NameFaker = {
  person: { firstName(): string; lastName(): string }
}

/**
 * A person's name the application will actually accept.
 *
 * `faker.person.fullName()` attaches a title or a suffix about one time in
 * seven — "Dr. Georgia Bartoletti", "Colleen Ledner Sr." — and the shared
 * `name()` rule is alpha-only plus spaces and dashes, so it rejects every one
 * of them. A factory that generates data its own validator refuses makes any
 * test that submits a generated name back through a form fail roughly one run
 * in seven: the kind of flake that never reproduces when you go looking for it.
 */
export function personName(faker: NameFaker): string {
  return `${faker.person.firstName()} ${faker.person.lastName()}`.replace(/[^a-zA-Z -]/g, '')
}
