import {
  setupMimiumAudioWorklet,
  MimiumProcessorNode,
} from "@mimium/mimium-webaudio";
import MimiumProcessorUrl from "../node_modules/@mimium/mimium-webaudio/dist/audioprocessor.mjs?url";
// const processorBlob = new Blob([workletURL], { type: "text/javascript" });
// const processorUrl = URL.createObjectURL(processorBlob);

let g_node: MimiumProcessorNode | null = null;
let g_context: AudioContext | null = null;
export const main = async (src: string) => {
  let ctx = new AudioContext();
  let mimiumnode = await setupMimiumAudioWorklet(ctx, src, MimiumProcessorUrl);
  const usermedia = await navigator.mediaDevices.getUserMedia({ audio: true });
  const microphone = ctx.createMediaStreamSource(usermedia);
  if (mimiumnode.numberOfInputs > 0) {
    microphone.connect(mimiumnode);
  }
  mimiumnode.connect(ctx.destination);
  g_node = mimiumnode;
  g_context = ctx;
};
document.addEventListener("DOMContentLoaded", () => {
  const button = document.querySelector("#play_button") as HTMLButtonElement;
  const stopbutton = document.querySelector(
    "#stop_button"
  ) as HTMLButtonElement;
  const updatebutton = document.querySelector(
    "#update_button"
  ) as HTMLButtonElement;
  updatebutton.setAttribute("disabled", "");
  button.addEventListener("click", async () => {
    if (!g_context || !g_node) {
      const textarea = document.querySelector("#src") as HTMLTextAreaElement;
      const src = textarea.value;
      updatebutton.removeAttribute("disabled");
      main(src);
    }
  });
  stopbutton.addEventListener("click", async () => {
    if (g_context) {
      g_context.close();
      updatebutton.setAttribute("disabled", "");
    }
  });
  updatebutton.addEventListener("click", async () => {
    if (g_node) {
      const textarea = document.querySelector("#src") as HTMLTextAreaElement;
      const src = textarea.value;
      g_node.port.postMessage({ type: "recompile", data: { src: src } });
    }
  });
});
