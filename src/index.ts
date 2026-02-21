/**
 * mimium-web-component
 *
 * Provides <mimium-editor> custom element with:
 *   - Monaco Editor with mimium syntax highlighting
 *   - Web Audio playback via @mimium/mimium-webaudio
 *   - Shadow DOM encapsulation
 *
 * Usage:
 *   <mimium-editor height="300">
 *     fn dsp() { sin(now * 440.0 * 6.2831853 / samplerate) }
 *   </mimium-editor>
 */

export { MimiumEditorElement } from "./mimium-editor.js";
export {
  registerMimiumLanguage,
  registerMimiumTheme,
  MIMIUM_LANGUAGE_ID,
} from "./mimium-language.js";

// Side effect: importing this module registers the <mimium-editor> custom element
import "./mimium-editor.js";
