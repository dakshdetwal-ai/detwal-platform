export interface Env {
  RELAY: DurableObjectNamespace;
  MASTER_TOKEN: string;
  FOLLOWER_TOKEN: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const channel = url.pathname.split("/").filter(Boolean)[1];
    const action = url.pathname.split("/").filter(Boolean)[0];
    if (!channel || !/^[a-zA-Z0-9_-]{8,64}$/.test(channel)) {
      return new Response("Invalid channel", { status: 400 });
    }

    const auth = request.headers.get("Authorization") || "";
    const isPublish = action === "publish";
    const expected = isPublish ? env.MASTER_TOKEN : env.FOLLOWER_TOKEN;
    if (!expected || auth !== `Bearer ${expected}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    const id = env.RELAY.idFromName(channel);
    return env.RELAY.get(id).fetch(new Request(
      new URL(isPublish ? "/publish" : "/snapshot", request.url),
      request
    ));
  }
};

export class SnapshotRelay {
  state: DurableObjectState;
  constructor(state: DurableObjectState) { this.state = state; }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "POST" && url.pathname === "/publish") {
      const body = await request.text();
      if (body.length > 64000 || !body.startsWith("DETWAL2;")) {
        return new Response("Invalid snapshot", { status: 400 });
      }
      const lines = body.trim().split("\n");
      const header = lines[0].split(";");
      const stamp = Number(header[1]);
      const count = Number(header[2]);
      if (!Number.isSafeInteger(stamp) || !Number.isInteger(count) ||
          count < 0 || count > 500 || lines.length - 1 !== count ||
          Math.abs(Date.now() / 1000 - stamp) > 15) {
        return new Response("Snapshot validation failed", { status: 422 });
      }
      await this.state.storage.put("snapshot", body);
      await this.state.storage.put("updated", Date.now());
      return new Response("OK", { status: 200 });
    }
    if (request.method === "GET" && url.pathname === "/snapshot") {
      const updated = await this.state.storage.get<number>("updated");
      const snapshot = await this.state.storage.get<string>("snapshot");
      if (!snapshot || !updated || Date.now() - updated > 30000) {
        return new Response("No fresh snapshot", { status: 404 });
      }
      return new Response(snapshot, {
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }
      });
    }
    return new Response("Not found", { status: 404 });
  }
}
