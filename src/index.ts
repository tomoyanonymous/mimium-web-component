import Worker from "./worker.ts?worker";
import MimiumProcessor from "./audioprocessor.js?worker&url";
import { MimiumProcessorNode, CompileData } from "./workletnode";
import wasmurl from "mimium-web/mimium_web_bg.wasm?url";

// const processorBlob = new Blob([workletURL], { type: "text/javascript" });
// const processorUrl = URL.createObjectURL(processorBlob);

const setupAudioWorklet = async (src: string) => {
  const userMedia = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false,
  });
  let audioNode;
  const audioContext = new AudioContext({ latencyHint: "interactive" });
  try {
    const response = await window.fetch(wasmurl);
    const wasmBytes = await response.arrayBuffer();
    try {
      await audioContext.audioWorklet.addModule(MimiumProcessor);
    } catch (e) {
      let err = e as unknown as Error;
      throw new Error(
        `Failed to load audio analyzer worklet at url: ${MimiumProcessor}. Further info: ${err.message}`
      );
    }
    audioNode = new MimiumProcessorNode(audioContext, "MimiumProcessor");
    audioNode.init(wasmBytes, {
      src: src,
      samplerate: audioContext.sampleRate,
      buffersize: 128,//AudioWorklet Always uses 128 for now
    } as CompileData);
    audioContext.resume();
    const microphone = await audioContext.createMediaStreamSource(userMedia);

    microphone.connect(audioNode).connect(audioContext.destination);
    return { node: audioNode, context: audioContext };
  } catch (e) {
    let err = e as unknown as Error;
    throw new Error(
      `Failed to load audio analyzer WASM module. Further info: ${err.message}`
    );
  }
};

let g_node: any = undefined;
let g_context: AudioContext | null = null;
const main = async (src: string) => {
  let { node, context } = await setupAudioWorklet(src);
  g_node = node;
  g_context = context;
};
document.addEventListener("DOMContentLoaded", () => {
  const button = document.querySelector("#play_button") as HTMLButtonElement;
  const stopbutton = document.querySelector("#stop_button") as HTMLButtonElement;

  button.addEventListener("click", async () => {
    const textarea = document.querySelector("#src") as HTMLTextAreaElement;
    const src = textarea.value;
    main(src);
  });
  stopbutton.addEventListener("click", async () => {
    if (g_context) {
      g_context.close();
    }
  })
});
