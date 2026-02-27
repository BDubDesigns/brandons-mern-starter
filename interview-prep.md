# Interview Prep — MERN Starter

## How to Use This File (for LLMs)

This file is a running log of interview questions and answers that emerged organically during the development of this MERN starter project. Each entry is tied to a real decision made in the codebase.

When asked to help with this file, you should:
- Add new Q&A entries in the correct category as they come up during development
- Never remove existing entries
- Keep answers concise — these are flashcard-style, not essays
- Reference the relevant file/pattern in the codebase where applicable

---

## Testing

**Q: When would you use `as unknown as T` in TypeScript?**
A: When the two types have no structural overlap and TypeScript rejects a direct `as T` cast. For example, casting a plain object to a Mongoose `Document` type (which requires many interface methods). If a direct cast works without error, prefer it — `as unknown as T` is the nuclear escape hatch, not the default.

---

**Q: Why keep test setup variables declared inside the `describe` block rather than at the file level?**
A: To keep scope as narrow as possible. File-level variables are visible to every test in the file, including tests that use completely different setups. Declaring inside the relevant `describe` block prevents accidental sharing and makes tests easier to reason about in isolation.

---

**Q: One assertion per test, or one scenario per test?**
A: Both are valid. One assertion per test gives faster, more precise failure messages — you immediately know *what* broke. One scenario per test reduces duplication and reads like a story. The key is consistency and being able to justify the choice. "I keep tests focused on one behavior so failures are self-documenting" is a strong answer.

---

**Q: How do you test a chained method call like `res.status(401).json({ message: "..." })`?**
A: Save the return value of the first spy so both the implementation and the assertion reference the same object:
```typescript
const jsonMock = { json: vi.fn() };
const res = { status: vi.fn().mockReturnValue(jsonMock) };
```
If you use `mockReturnValue` with an inline object, each call to `status()` returns a brand new object — the `json` spy your code called and the one you assert on would be different instances.

---

**Q: Why does TypeScript make shape tests redundant?**
A: TypeScript return types are enforced at compile time. If a function is typed to return `{ userId: string; email: string }`, a test asserting those properties exist adds no value — TypeScript already guarantees it. Tests should cover *behavior*, not types.

---

**Q: When is a `vi.fn()` inline sufficient vs needing to save the reference?**
A: Plain calls (`next()`) — inline `vi.fn()` is fine, assert with `toHaveBeenCalled()` directly. Chained calls (`res.status(401).json(...)`) — save the inner mock so both the code under test and your assertion reference the same spy instance.
