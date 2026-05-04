import type { ServerMessage, ClientMessage } from "@dalkong/shared";

import { tokenStore } from "@/auth/tokenStore";
import { wsBaseUrl } from "@/lib/config";

interface SignalingClientOptions {
  deviceId: string;
  deviceSecret: string;
  sessionId: string;
  onMessage: (msg: ServerMessage) => void;
  onClose?: (code: number, reason: string) => void;
  onError?: (err: unknown) => void;
}

export class SignalingClient {
  private socket: WebSocket | null = null;
  private opts: SignalingClientOptions;
  private explicitlyClosed = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 1000;

  constructor(opts: SignalingClientOptions) {
    this.opts = opts;
  }

  connect(): void {
    if (this.socket && this.socket.readyState <= WebSocket.OPEN) return;
    this.explicitlyClosed = false;

    const token = tokenStore.getAccessToken();
    if (!token) {
      this.opts.onError?.(new Error("missing access token"));
      return;
    }

    const url = `${wsBaseUrl}/signaling`;
    const socket = new WebSocket(url, undefined, {
      headers: { authorization: `Bearer ${token}` },
    } as unknown as string[]);

    this.socket = socket;

    socket.onopen = () => {
      this.reconnectDelay = 1000;
      this.send({
        type: "hello",
        deviceId: this.opts.deviceId,
        deviceSecret: this.opts.deviceSecret,
        sessionId: this.opts.sessionId,
      });
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(
          typeof event.data === "string"
            ? event.data
            : new TextDecoder().decode(event.data as ArrayBuffer),
        ) as ServerMessage;
        this.opts.onMessage(msg);
      } catch (err) {
        this.opts.onError?.(err);
      }
    };

    socket.onerror = (err) => {
      this.opts.onError?.(err);
    };

    socket.onclose = (event) => {
      this.socket = null;
      this.opts.onClose?.(event.code, event.reason ?? "");
      if (this.explicitlyClosed) return;
      if (event.code === 4401 || event.code === 4403 || event.code === 4404) {
        return;
      }
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    const delay = this.reconnectDelay;
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30_000);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  send(msg: ClientMessage): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify(msg));
  }

  close(): void {
    this.explicitlyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.socket?.close(1000, "client close");
    this.socket = null;
  }
}
