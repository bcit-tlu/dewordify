# Tests

Dewordify uses [Vitest](https://vitest.dev) for testing. Run the suite with:

```bash
npm test
```

## How the tests work

There are three kinds of tests, each exercising a different layer of the
conversion pipeline.

### 1. Guide example tests — per-feature conversion checks

Most markers documented in the [conversion guide](https://conversion-guide.ltc.bcit.ca)
have a fixture and a test that verifies dewordify produces the documented HTML.
(The `tables/` and `text/` fixtures don't have dedicated tests — those scenarios
are covered inline in `guide-examples.test.ts` instead.)

**Fixture format** (`tests/fixtures/guide/<category>/<name>.html`):

Each fixture contains two custom tags inside a single HTML file:

```html
<preview>
  <!-- the expected HTML output after conversion -->
</preview>

<word>
  <!-- the raw Word-exported HTML that dewordify receives as input -->
</word>
```

The helper `guideExample(category, name)` (in `tests/helpers/guide.ts`) reads
the file and returns `{ word, preview }` — the inner HTML of each tag.

**Test pattern** (`tests/<category>/<name>.test.ts`):

```ts
import { describe, expect, it } from "vitest";
import { loadHtml } from "../../src/core/load-html.js";
import { convertWord, guideExample, norm } from "../helpers/guide.js";

const { word, preview } = guideExample("interactions", "accordion");

describe("interactions/accordion", () => {
  it("converts the guide's Word example into div.accordion matching the documented HTML", () => {
    const output = convertWord(word);
    const expected = loadHtml(preview);

    const accordion = output("div.accordion");
    expect(accordion.length).toBe(1);
    expect(norm(accordion)).toBe(norm(expected("div.accordion")));
  });
});
```

- `convertWord(wordHtml)` runs the input through the markout pipeline and
  returns a Cheerio instance of the output.
- `norm()` reduces a Cheerio selection (or string) to its text content with
  whitespace collapsed, so indentation and line-break differences don't cause
  false failures. DOM structure is verified separately via selector assertions
  (e.g. `expect(accordion.length).toBe(1)`); `norm()` compares only the text.

Fixtures are verbatim copies of the conversion guide's `partials/` files
(`<preview>` + `<word>` sections only). The contract is that `<word>`
converts into `<preview>` — every guide-example test asserts both structure
(selector/property checks) and content (`norm()` against `<preview>`). If a
test fails, the converter and the guide have drifted: fix whichever is wrong,
then re-copy the fixture from the guide. Never edit a fixture's `<preview>`
to match incorrect converter output.

### 2. Marker parity test — `markers.test.ts`

`tests/fixtures/marker-reference.html` is a copy of the conversion guide's
marker reference page. The test parses it to extract every documented marker
name (e.g. `#activity`, `#accordion`), then asserts each one exists in
dewordify's `defaultMarkoutMap`. This catches drift between the guide's
documentation and dewordify's implementation.

### 3. Pipeline tests — `pipeline.test.ts`

End-to-end tests that feed real `.docx` files (from `tests/fixtures/`)
through the full `convert()` function and verify:

- HTML pages are produced with correct `NN_slug.html` filenames
- Assets are extracted into `assets/`
- Stats are collected
- Documents without Heading 1 produce a single named page with a warning

### 4. Inline tests — `guide-examples.test.ts`

A consolidated test file that covers learning blocks, text, media, tables,
interactions, and knowledge checks using inline HTML strings (no fixture
files). Useful for testing edge cases and marker combinations that don't
need a full guide example fixture.

## Directory structure

```
tests/
├── README.md                          ← this file
├── helpers/
│   └── guide.ts                       ← shared helpers (guideExample, convertWord, norm)
├── fixtures/
│   ├── marker-reference.html          ← conversion guide marker reference (parity check)
│   ├── all-features.docx              ← real Word docs for pipeline tests
│   ├── sample-all-hidden-styles.docx
│   └── guide/                         ← per-feature input/output pairs
│       ├── interactions/
│       │   └── accordion.html         ← <preview>…</preview><word>…</word>
│       ├── knowledge-check/
│       ├── learning-blocks/
│       ├── media/
│       ├── modules/                   ← full-page end-to-end examples (paired .docx + .html)
│       ├── tables/
│       └── text/
├── guide-examples.test.ts             ← inline conversion tests (no fixtures)
├── markers.test.ts                    ← marker parity with conversion guide
├── pipeline.test.ts                   ← end-to-end .docx → HTML pipeline tests
├── normalize.test.ts
├── multi-image.test.ts
├── interactions/                      ← per-feature guide example tests
├── knowledge-check/
├── learning-blocks/
└── media/
```

## Adding a new test

### Adding a guide example test for a new marker

1. **Create the fixture** at
   `tests/fixtures/guide/<category>/<name>.html`:

   ```html
   <preview>
     <!-- the HTML dewordify should produce -->
     <div class="my-marker">
       <h2>Title</h2>
       <p>Content</p>
     </div>
   </preview>

   <word>
     <!-- the Word-exported HTML dewordify receives -->
     <p>#my-marker</p>
     <h2>Title</h2>
     <p>Content</p>
     <p>/my-marker</p>
   </word>
   ```

   Use an existing fixture in the same category as a template to match the
   style and complexity of the examples.

2. **Create the test** at
   `tests/<category>/<name>.test.ts`:

   ```ts
   import { describe, expect, it } from "vitest";
   import { loadHtml } from "../../src/core/load-html.js";
   import { convertWord, guideExample, norm } from "../helpers/guide.js";

   const { word, preview } = guideExample("<category>", "<name>");

   describe("<category>/<name>", () => {
     it("converts the guide's Word example into the documented HTML", () => {
       const output = convertWord(word);
       const expected = loadHtml(preview);

       const result = output("div.my-marker");
       expect(result.length).toBe(1);
       expect(norm(result)).toBe(norm(expected("div.my-marker")));
     });
   });
   ```

   Replace `div.my-marker` with the selector that matches the converted
   output. For attribute checks, add assertions like:

   ```ts
   expect(result.attr("data-button")).toBe("Answer");
   ```

3. **Run the test** to confirm it passes:

   ```bash
   npm test -- <name>
   ```

   If it fails, compare `output.html()` against the `<preview>` section to
   find the mismatch.

### Adding a pipeline test for a new .docx fixture

1. Place the `.docx` file in `tests/fixtures/`.
2. Add a test case to `tests/pipeline.test.ts` following the existing
   pattern — call `convert()` with the fixture, then assert on the output
   files, assets, and stats.

### Adding an inline test (no fixture needed)

For edge cases or marker combinations that don't warrant a full guide
example, add a `describe`/`it` block to `tests/guide-examples.test.ts`
using inline HTML strings with `convertFragment()`.
