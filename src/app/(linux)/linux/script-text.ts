import snippets from "./content/snippets.json";
import { oneshotScript } from "./oneshot-script";

const ONESHOT_PREFIX = "code-oneshot-";
const snippetsById = snippets as Record<string, string>;

/** The exact text a Copy button writes. Oneshot ids are assembled; every other id is stored whole. */
export function scriptText(id: string): string {
    const text = id.startsWith(ONESHOT_PREFIX) ? oneshotScript(id.slice(ONESHOT_PREFIX.length)) : snippetsById[id];
    if (!text) throw new Error(`Missing script: ${id}`);
    return text;
}
