# mimium-web-component

A Web Component that embeds a [mimium](https://mimium.org) language editor and audio player on any web page.

- **`<mimium-editor>`** custom element — Shadow DOM encapsulated, zero external CSS needed
- **Monaco Editor** with mimium syntax highlighting
- **Web Audio playback** via [`@mimium/mimium-webaudio`](https://github.com/mimium-org/mimium-rs)
- Live update (recompile without stopping audio)

## Usage

```html
<script type="module" src="mimium-web-component.js"></script>

<mimium-editor height="300" label="example.mmm">
fn dsp(){
    sin(now * 440.0 * 6.2831853 / samplerate)
}
</mimium-editor>
```

### Attributes

| Attribute  | Type    | Default | Description |
|------------|---------|---------|-------------|
| `height`   | number  | `200`   | Editor height in pixels |
| `label`    | string  | —       | Optional filename label shown in the header |
| `theme`    | string  | `dark`  | `dark` or `light` |
| `readonly` | boolean | —       | Makes the editor read-only when present |
| `src`      | string  | —       | Sets initial source code via attribute (overrides inner text) |

### Setting source code

Source code can be written as inner text of the element:

```html
<mimium-editor label="sine.mmm">
fn dsp(){
    sin(now * 440.0 * 6.2831853 / samplerate)
}
</mimium-editor>
```

Or set/read programmatically:

```js
const editor = document.querySelector('mimium-editor');

// Get current source
const src = editor.getSource();

// Set source
editor.setSource('fn dsp(){ 0.0 }');

// Change label dynamically
editor.setAttribute('label', 'new.mmm');
```

### Events

| Event    | Detail          | Description |
|----------|-----------------|-------------|
| `play`   | `{ src: string }` | Fired when playback starts |
| `stop`   | —               | Fired when playback stops |
| `update` | `{ src: string }` | Fired when code is sent to a running audio node |

```js
document.querySelector('mimium-editor').addEventListener('play', (e) => {
    console.log('Playing:', e.detail.src);
});
```

## Development

Requires [pnpm](https://pnpm.io).

```sh
pnpm install
pnpm dev      # start dev server at http://localhost:5173
pnpm build    # build to dist/
pnpm preview  # preview the built output
```

## Publishing

Releases are published to npm via GitHub Actions using **npm OIDC trusted publishing**.  
No npm token is stored as a GitHub secret — npm exchanges the GitHub Actions OIDC token directly.

### One-time setup on npmjs.com

1. Open the package page on [npmjs.com](https://www.npmjs.com) and go to **Publishing access**.
2. Under **Trusted publishers**, click **Add a publisher** and fill in:
   - **Owner**: `tomoyanonymous`
   - **Repository**: `mimium-web-component`
   - **Workflow**: `publish.yml`
   - **Environment**: *(leave blank)*

That's it — no `NPM_TOKEN` secret required.

### Release workflow

Tag a commit with a version tag and push — the workflow runs automatically:

```sh
git tag v2.1.0
git push origin v2.1.0
```

The [publish workflow](.github/workflows/publish.yml) will:
1. Install dependencies with `pnpm --frozen-lockfile`
2. Build with `pnpm build`
3. Publish with `pnpm publish --provenance` — npm verifies the OIDC token and attaches a signed provenance attestation to the package

## Architecture

| File | Role |
|------|------|
| `src/mimium-editor.ts` | `<mimium-editor>` custom element (Shadow DOM + audio control) |
| `src/mimium-language.ts` | Monaco Editor language definition and themes for mimium |
| `src/index.ts` | Public entry point, registers the custom element |
| `mimium.tmLanguage.json` | TextMate grammar (reference for VS Code extension) |
| `mimium_logo_slant.svg` | Logo displayed in the editor header |

### Monaco in Shadow DOM

Monaco Editor injects CSS into `document.head`, which does not pierce Shadow DOM boundaries. This component copies those `<style>` elements into the Shadow Root using a `MutationObserver`, ensuring correct rendering without leaking styles to the host page.

## License

[MPL-2.0](LICENSE) © Tomoya Matsuura
