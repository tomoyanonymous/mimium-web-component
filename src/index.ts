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
    const response =  await window.fetch(wasmurl);
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
      buffersize: 2048,
    } as CompileData);
    audioContext.resume();
    const microphone = await audioContext.createMediaStreamSource(userMedia);

    microphone.connect(audioNode).connect(audioContext.destination);
  } catch (e) {
    let err = e as unknown as Error;
    throw new Error(
      `Failed to load audio analyzer WASM module. Further info: ${err.message}`
    );
  }
};

const main = async (src: string) => {
  setupAudioWorklet(src);
};
document.addEventListener("DOMContentLoaded", () => {
  const button = document.querySelector("#button") as HTMLButtonElement;
  const src = document.querySelector("#src")?.textContent as string;
  button.addEventListener("click", async () => {
    main(src);
  });
});
