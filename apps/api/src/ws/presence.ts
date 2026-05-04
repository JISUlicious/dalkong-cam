import type { WebSocket } from "@fastify/websocket";

export interface PresenceEntry {
  socket: WebSocket;
  userId: string;
  deviceId: string;
  role: "camera" | "viewer";
  name: string;
  sessionId: string;
}

class PresenceTracker {
  private byDeviceId = new Map<string, PresenceEntry>();

  set(entry: PresenceEntry): void {
    const prev = this.byDeviceId.get(entry.deviceId);
    if (prev && prev.socket !== entry.socket) {
      try {
        prev.socket.close(4001, "superseded");
      } catch {
        /* ignore */
      }
    }
    this.byDeviceId.set(entry.deviceId, entry);
  }

  remove(deviceId: string, socket: WebSocket): void {
    const cur = this.byDeviceId.get(deviceId);
    if (cur && cur.socket === socket) {
      this.byDeviceId.delete(deviceId);
    }
  }

  get(deviceId: string): PresenceEntry | undefined {
    return this.byDeviceId.get(deviceId);
  }

  isOnline(deviceId: string): boolean {
    return this.byDeviceId.has(deviceId);
  }

  forUser(userId: string): PresenceEntry[] {
    return [...this.byDeviceId.values()].filter((p) => p.userId === userId);
  }
}

export const presenceTracker = new PresenceTracker();
