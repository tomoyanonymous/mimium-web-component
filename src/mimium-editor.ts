import type { MimiumProcessorNode } from "@mimium/mimium-webaudio";
import MimiumProcessorUrl from "../node_modules/@mimium/mimium-webaudio/dist/audioprocessor.mjs?url";
import MimiumLogoUrl from "../mimium_logo_slant.svg?url";
import * as monaco from "monaco-editor";
import {
  registerMimiumLanguage,
  registerMimiumTheme,
  MIMIUM_LANGUAGE_ID,
} from "./mimium-language.js";

// Monaco Editor worker setup
// Workers are needed for Monaco to function properly
// Use getWorker (not getWorkerUrl) so we can specify type:'module', which is
// required by Monaco 0.44+ when the host page loads the bundle as an ES module.
// importScripts() is forbidden inside module workers.
self.MonacoEnvironment = {
  getWorker(_moduleId: string, _label: string) {
    return new Worker(
      new URL("monaco-editor/esm/vs/editor/editor.worker.js", import.meta.url),
      { type: "module" },
    );
  },
};

// Register mimium language and themes (once globally)
let languageRegistered = false;
function ensureLanguageRegistered() {
  if (!languageRegistered) {
    registerMimiumLanguage();
    registerMimiumTheme();
    languageRegistered = true;
  }
}

const DEFAULT_CODE = `fn counter(){
    (self+440/48000)%1.0
}
fn dsp(){
    let phase = counter()
    sin(phase*6.2831853)
}`;

const STYLES = `
mimium-editor {
  display: block;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --mimium-bg: #1E1E2E;
  --mimium-fg: #D4D4D4;
  --mimium-accent: #569CD6;
  --mimium-accent-hover: #6CB2EB;
  --mimium-btn-bg: #2D2D3D;
  --mimium-btn-hover: #3D3D4D;
  --mimium-btn-active: #4D4D5D;
  --mimium-border: #404050;
  --mimium-success: #4EC9B0;
  --mimium-danger: #F44747;
  --mimium-warning: #CCA700;
}

.mimium-container {
  background: var(--mimium-bg);
  border: 1px solid var(--mimium-border);
  border-radius: 8px;
  overflow: hidden;
  color: var(--mimium-fg);
}

.mimium-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(255,255,255,0.03);
  border-bottom: 1px solid var(--mimium-border);
}

.mimium-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--mimium-accent);
  display: flex;
  align-items: center;
  gap: 6px;
  user-select: none;
}

.mimium-title img {
  height: 28px;
  width: auto;
  display: block;
}

.mimium-label {
  font-size: 12px;
  font-weight: 400;
  color: #aaa;
  font-family: "SF Mono", "Fira Mono", Menlo, Consolas, monospace;
  padding: 2px 6px;
  border-radius: 3px;
  background: rgba(255,255,255,0.06);
  user-select: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 240px;
}

.mimium-label:empty {
  display: none;
}

.mimium-controls {
  display: flex;
  gap: 6px;
}

.mimium-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px solid var(--mimium-border);
  border-radius: 4px;
  background: var(--mimium-btn-bg);
  color: var(--mimium-fg);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.mimium-btn:hover {
  background: var(--mimium-btn-hover);
}

.mimium-btn:active {
  background: var(--mimium-btn-active);
}

.mimium-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.mimium-btn--play {
  border-color: var(--mimium-success);
  color: var(--mimium-success);
}

.mimium-btn--play:hover {
  background: rgba(78, 201, 176, 0.15);
}

.mimium-btn--stop {
  border-color: var(--mimium-danger);
  color: var(--mimium-danger);
}

.mimium-btn--stop:hover {
  background: rgba(244, 71, 71, 0.15);
}

.mimium-btn--update {
  border-color: var(--mimium-warning);
  color: var(--mimium-warning);
}

.mimium-btn--update:hover {
  background: rgba(204, 167, 0, 0.15);
}

.mimium-editor-container {
  width: 100%;
  position: relative;
  overflow: hidden;
}

/* Reset host-site textarea styles that would break Monaco's internal textareas */
mimium-editor textarea {
  min-height: 0 !important;
  height: auto !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
  resize: none !important;
  font-size: inherit !important;
  line-height: inherit !important;
}

.mimium-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  font-size: 11px;
  color: #888;
  background: rgba(0,0,0,0.2);
  border-top: 1px solid var(--mimium-border);
}

.mimium-error {
  min-height: 18px;
  padding: 4px 12px;
  font-size: 11px;
  color: var(--mimium-danger);
  background: rgba(244, 71, 71, 0.08);
  border-top: 1px solid var(--mimium-border);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mimium-error:empty {
  display: none;
}

.mimium-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #555;
}

.mimium-status-dot--playing {
  background: var(--mimium-success);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
`;

/**
 * <mimium-editor> Web Component
 *
 * A self-contained mimium language editor and player using Monaco Editor
 * and Web Audio API.
 *
 * Attributes:
 *   - src: Initial mimium source code
 *   - height: Editor height in pixels (default: 200)
 *   - theme: "dark" (default) or "light"
 *   - readonly: If present, editor is read-only
 *
 * Usage:
 *   <mimium-editor height="300">
 *     fn dsp() {
 *       sin(now * 440.0 * 6.2831853 / samplerate)
 *     }
 *   </mimium-editor>
 */
// Inject component styles into document.head once (light DOM approach).
// Shadow DOM cannot be used with Monaco because Monaco injects its own
// CSS into document.head; those styles don't cross the shadow boundary,
// causing the textarea/cursor to be mispositioned.
let componentStylesInjected = false;
function injectComponentStyles() {
  if (componentStylesInjected) return;
  componentStylesInjected = true;
  const style = document.createElement("style");
  style.setAttribute("data-mimium-component", "true");
  style.textContent = STYLES;
  document.head.appendChild(style);
}

export class MimiumEditorElement extends HTMLElement {
  private mimiumWebAudioModule: {
    setupMimiumAudioWorklet: (
      ctx: AudioContext,
      src: string,
      processorUrl: string,
      options?: { libBaseUrl?: string; moduleBaseUrl?: string },
    ) => Promise<MimiumProcessorNode>;
    preloadMimiumLibCache?: (opts: { libBaseUrl: string }) => Promise<void>;
  } | null = null;
  private editorContainer: HTMLDivElement | null = null;
  private monacoEditor: monaco.editor.IStandaloneCodeEditor | null = null;
  private audioContext: AudioContext | null = null;
  private mimiumNode: MimiumProcessorNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private playButton: HTMLButtonElement | null = null;
  private stopButton: HTMLButtonElement | null = null;
  private updateButton: HTMLButtonElement | null = null;
  private statusDot: HTMLDivElement | null = null;
  private statusText: HTMLSpanElement | null = null;
  private errorText: HTMLDivElement | null = null;
  private labelEl: HTMLSpanElement | null = null;
  private _initialCode: string | null = null;
  private _isPlaying = false;
  private runtimeErrorListener: ((ev: Event) => void) | null = null;
  private static readonly COMPILE_TIMEOUT_MS = 30000;

  static get observedAttributes() {
    return ["src", "height", "theme", "readonly", "label"];
  }

  constructor() {
    super();
    this._initialCode = this.textContent?.trim() || null;
  }

  connectedCallback() {
    injectComponentStyles();
    ensureLanguageRegistered();
    this.render();
    this.setupEditor();
  }

  disconnectedCallback() {
    this.stopAudio();
    if (this.monacoEditor) {
      this.monacoEditor.dispose();
      this.monacoEditor = null;
    }
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    if (name === "theme" && this.monacoEditor) {
      const theme = newValue === "light" ? "mimium-light" : "mimium-dark";
      monaco.editor.setTheme(theme);
    }
    if (name === "height" && this.editorContainer) {
      this.editorContainer.style.height = `${newValue || 200}px`;
      this.monacoEditor?.layout();
    }
    if (name === "readonly" && this.monacoEditor) {
      this.monacoEditor.updateOptions({ readOnly: newValue !== null });
    }
    if (name === "label" && this.labelEl) {
      this.labelEl.textContent = newValue ?? "";
    }
  }

  private getEditorHeight(): number {
    const h = this.getAttribute("height");
    return h ? parseInt(h, 10) : 200;
  }

  private getTheme(): string {
    return this.getAttribute("theme") === "light"
      ? "mimium-light"
      : "mimium-dark";
  }

  private isReadonly(): boolean {
    return this.hasAttribute("readonly");
  }

  private getInitialCode(): string {
    // 1. Check src attribute
    const srcAttr = this.getAttribute("src");
    if (srcAttr) return srcAttr;

    // 2. Use text content captured before render() overwrote innerHTML
    if (this._initialCode) return this._initialCode;

    // 3. Fallback
    return DEFAULT_CODE;
  }

  private render() {
    // Clear light DOM content (original text node used as initial code)
    this.innerHTML = "";

    const container = document.createElement("div");
    container.className = "mimium-container";

    // Header
    const header = document.createElement("div");
    header.className = "mimium-header";

    const title = document.createElement("div");
    title.className = "mimium-title";
    const logoImg = document.createElement("img");
    logoImg.src = MimiumLogoUrl;
    logoImg.alt = "mimium";
    title.appendChild(logoImg);

    this.labelEl = document.createElement("span");
    this.labelEl.className = "mimium-label";
    this.labelEl.textContent = this.getAttribute("label") ?? "";
    title.appendChild(this.labelEl);

    const controls = document.createElement("div");
    controls.className = "mimium-controls";

    this.playButton = document.createElement("button");
    this.playButton.className = "mimium-btn mimium-btn--play";
    this.playButton.textContent = "▶ Play";
    this.playButton.addEventListener("click", () => this.play());

    this.stopButton = document.createElement("button");
    this.stopButton.className = "mimium-btn mimium-btn--stop";
    this.stopButton.textContent = "■ Stop";
    this.stopButton.addEventListener("click", () => this.stopAudio());

    this.updateButton = document.createElement("button");
    this.updateButton.className = "mimium-btn mimium-btn--update";
    this.updateButton.textContent = "↻ Update";
    this.updateButton.disabled = true;
    this.updateButton.addEventListener("click", () => this.updateCode());

    controls.appendChild(this.playButton);
    controls.appendChild(this.stopButton);
    controls.appendChild(this.updateButton);

    header.appendChild(title);
    header.appendChild(controls);

    // Editor area
    this.editorContainer = document.createElement("div");
    this.editorContainer.className = "mimium-editor-container";
    this.editorContainer.style.height = `${this.getEditorHeight()}px`;

    // Status bar
    const statusBar = document.createElement("div");
    statusBar.className = "mimium-status";

    this.statusDot = document.createElement("div");
    this.statusDot.className = "mimium-status-dot";

    this.statusText = document.createElement("span");
    this.statusText.textContent = "Ready";
    const errorText = document.createElement("div");
    errorText.className = "mimium-error";
    this.errorText = errorText;

    statusBar.appendChild(this.statusDot);
    statusBar.appendChild(this.statusText);

    // Assemble
    container.appendChild(header);
    container.appendChild(this.editorContainer);
    container.appendChild(statusBar);
    container.appendChild(errorText);

    this.appendChild(container);
  }

  private setupEditor() {
    if (!this.editorContainer) return;

    this.monacoEditor = monaco.editor.create(this.editorContainer, {
      value: this.getInitialCode(),
      language: MIMIUM_LANGUAGE_ID,
      theme: this.getTheme(),
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineNumbers: "on",
      renderLineHighlight: "line",
      tabSize: 4,
      insertSpaces: true,
      automaticLayout: true,
      readOnly: this.isReadonly(),
      padding: { top: 8, bottom: 8 },
      overviewRulerLanes: 0,
      hideCursorInOverviewRuler: true,
      overviewRulerBorder: false,
      scrollbar: {
        verticalScrollbarSize: 8,
        horizontalScrollbarSize: 8,
      },
    });
  }

  private setStatus(text: string, playing: boolean) {
    if (this.statusText) this.statusText.textContent = text;
    if (this.statusDot) {
      this.statusDot.className = playing
        ? "mimium-status-dot mimium-status-dot--playing"
        : "mimium-status-dot";
    }
  }

  private setError(message: string | null) {
    if (!this.errorText) return;
    this.errorText.textContent = message ?? "";
  }

  private withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    label: string,
  ) {
    return new Promise<T>((resolve, reject) => {
      const timer = window.setTimeout(() => {
        reject(
          new Error(
            `${label} timed out after ${timeoutMs}ms. No compile response from AudioWorkletProcessor.`,
          ),
        );
      }, timeoutMs);

      promise.then(
        (value) => {
          window.clearTimeout(timer);
          resolve(value);
        },
        (error) => {
          window.clearTimeout(timer);
          reject(error);
        },
      );
    });
  }

  private formatError(err: unknown): string {
    if (err instanceof Error) return err.message;
    return String(err);
  }

  private getSetupOptions() {
    return {
      libBaseUrl:
        "https://raw.githubusercontent.com/mimium-org/mimium-rs/dev/lib/",
      moduleBaseUrl: new URL(".", import.meta.url).toString(),
    };
  }

  private async loadMimiumWebAudioModule() {
    if (this.mimiumWebAudioModule) return this.mimiumWebAudioModule;

    const nativeTextEncoder = globalThis.TextEncoder;
    const nativeTextDecoder = globalThis.TextDecoder;

    const loaded = (await import("@mimium/mimium-webaudio")) as {
      setupMimiumAudioWorklet: (
        ctx: AudioContext,
        src: string,
        processorUrl: string,
        options?: { libBaseUrl?: string; moduleBaseUrl?: string },
      ) => Promise<MimiumProcessorNode>;
      preloadMimiumLibCache?: (opts: { libBaseUrl: string }) => Promise<void>;
    };

    if (nativeTextEncoder) globalThis.TextEncoder = nativeTextEncoder;
    if (nativeTextDecoder) globalThis.TextDecoder = nativeTextDecoder;

    this.mimiumWebAudioModule = loaded;
    return loaded;
  }

  private async preloadLibCacheIfAvailable() {
    const options = this.getSetupOptions();
    const mimiumWebAudio = await this.loadMimiumWebAudioModule();
    const preload = mimiumWebAudio.preloadMimiumLibCache;

    if (typeof preload === "function") {
      await preload({
        libBaseUrl: options.libBaseUrl,
      });
    }
  }

  private detachRuntimeErrorListener() {
    if (this.mimiumNode && this.runtimeErrorListener) {
      this.mimiumNode.removeEventListener(
        "mimium-runtime-error",
        this.runtimeErrorListener,
      );
    }
    this.runtimeErrorListener = null;
  }

  private async createCompiledNode(
    ctx: AudioContext,
    src: string,
  ): Promise<MimiumProcessorNode> {
    await this.preloadLibCacheIfAvailable();
    const mimiumWebAudio = await this.loadMimiumWebAudioModule();

    const node = await this.withTimeout(
      mimiumWebAudio.setupMimiumAudioWorklet(
        ctx,
        src,
        MimiumProcessorUrl,
        this.getSetupOptions(),
      ),
      MimiumEditorElement.COMPILE_TIMEOUT_MS,
      "mimium compile",
    );

    this.runtimeErrorListener = (ev: Event) => {
      const detail = (ev as CustomEvent<{ message: string }>).detail;
      const message = detail?.message || "Unknown runtime error";
      console.error("mimium runtime error:", message);
      this.setStatus(`Runtime error: ${message}`, false);
      this.setError(message);
    };

    node.addEventListener("mimium-runtime-error", this.runtimeErrorListener);
    node.onprocessorerror = (ev) => {
      console.error("processor error:", ev);
      this.setStatus("Runtime error: Audio processor failed", false);
      this.setError("Audio processor failed");
    };

    return node;
  }

  /**
   * Play the current code
   */
  async play() {
    if (this._isPlaying) return;

    const src = this.monacoEditor?.getValue() || "";
    if (!src.trim()) {
      this.setStatus("No source code", false);
      this.setError("No source code");
      return;
    }

    try {
      this.setError(null);
      this.setStatus("Starting...", false);
      const ctx = new AudioContext();
      await ctx.resume();
      const mimiumNode = await this.createCompiledNode(ctx, src);
      try {
        const usermedia = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const microphone = ctx.createMediaStreamSource(usermedia);
        if (mimiumNode.numberOfInputs > 0) {
          microphone.connect(mimiumNode);
        }
        this.microphone = microphone;
      } catch {
        // Microphone not available, continue without it
      }

      mimiumNode.connect(ctx.destination);

      this.audioContext = ctx;
      this.mimiumNode = mimiumNode;
      this._isPlaying = true;

      if (this.updateButton) this.updateButton.disabled = false;
      this.setStatus("Playing", true);
      this.setError(null);

      this.dispatchEvent(new CustomEvent("play", { detail: { src } }));
    } catch (e) {
      const message = this.formatError(e);
      this.setStatus(`Error: ${message}`, false);
      this.setError(message);
      console.error("[mimium-editor] Play error:", e);
    }
  }

  /**
   * Stop audio playback
   */
  async stopAudio() {
    this.detachRuntimeErrorListener();
    this.mimiumNode?.disconnect();
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
      this.mimiumNode = null;
      this.microphone = null;
    }
    this._isPlaying = false;
    if (this.updateButton) this.updateButton.disabled = true;
    this.setStatus("Stopped", false);

    this.dispatchEvent(new CustomEvent("stop"));
  }

  /**
   * Send updated code to running audio processor
   */
  async updateCode() {
    if (!this.mimiumNode || !this.audioContext) return;
    const src = this.monacoEditor?.getValue() || "";
    const currentNode = this.mimiumNode;
    const currentRuntimeErrorListener = this.runtimeErrorListener;
    this.setError(null);
    this.setStatus("Updating...", true);

    try {
      const nextNode = await this.createCompiledNode(this.audioContext, src);

      if (this.microphone && nextNode.numberOfInputs > 0) {
        this.microphone.connect(nextNode);
      }
      nextNode.connect(this.audioContext.destination);

      if (currentRuntimeErrorListener) {
        currentNode.removeEventListener(
          "mimium-runtime-error",
          currentRuntimeErrorListener,
        );
      }
      currentNode.onprocessorerror = null;
      currentNode.disconnect();
      this.mimiumNode = nextNode;
      this.setStatus("Code updated", true);
      this.setError(null);
    } catch (e) {
      const message = this.formatError(e);
      this.setStatus(`Update error: ${message}`, true);
      this.setError(message);
      console.error("[mimium-editor] Update error:", e);
      return;
    }

    this.dispatchEvent(new CustomEvent("update", { detail: { src } }));
  }

  /**
   * Get the current source code from the editor
   */
  getSource(): string {
    return this.monacoEditor?.getValue() || "";
  }

  /**
   * Set the source code in the editor
   */
  setSource(code: string) {
    this.monacoEditor?.setValue(code);
  }

  get isPlaying(): boolean {
    return this._isPlaying;
  }
}

// Register the custom element
customElements.define("mimium-editor", MimiumEditorElement);

// Also export as default
export default MimiumEditorElement;
