import Worker from "./worker.ts?worker";
import MimiumProcessor from "./audioprocessor.js?url";
// const processorBlob = new Blob([workletURL], { type: "text/javascript" });
// const processorUrl = URL.createObjectURL(processorBlob);

const setupAudioWorklet = async (src: string) => {
  const userMedia = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false,
  });
  const audioContext = new AudioContext();
  audioContext.resume();
  const microphone = await audioContext.createMediaStreamSource(userMedia);
  await audioContext.audioWorklet.addModule("./audioprocessor.js");
  const audioNode = new AudioWorkletNode(audioContext, "MimiumAudioProcessor");
  audioNode.port.postMessage({
    type: "compile",
    src: src,
    samplerate: audioContext.sampleRate,
    buffersize: audioContext.outputLatency,
  });

  microphone.connect(audioNode).connect(audioContext.destination);
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
