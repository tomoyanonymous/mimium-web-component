import {
  setupAudioWorklet,
  MimiumProcessorNode,
} from "@mimium/mimium-webaudio";
import MimiumProcessorUrl from "../node_modules/@mimium/mimium-webaudio/dist/audioprocessor.mjs?url";
// const processorBlob = new Blob([workletURL], { type: "text/javascript" });
// const processorUrl = URL.createObjectURL(processorBlob);

let g_node: any = undefined;
let g_context: AudioContext | null = null;
export const main = async (src: string) => {
  let { node, context } = await setupAudioWorklet(src, MimiumProcessorUrl);
  g_node = node;
  g_context = context;
};
document.addEventListener("DOMContentLoaded", () => {
  const button = document.querySelector("#play_button") as HTMLButtonElement;
  const stopbutton = document.querySelector(
    "#stop_button"
  ) as HTMLButtonElement;

  button.addEventListener("click", async () => {
    const textarea = document.querySelector("#src") as HTMLTextAreaElement;
    const src = textarea.value;
    main(src);
  });
  stopbutton.addEventListener("click", async () => {
    if (g_context) {
      g_context.close();
    }
  });
});
