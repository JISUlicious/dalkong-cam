import { z } from "zod";

export const sdpSchema = z.object({
  type: z.enum(["offer", "answer", "pranswer", "rollback"]),
  sdp: z.string().min(1).max(64 * 1024),
});

export const iceCandidateSchema = z.object({
  candidate: z.string().max(1024),
  sdpMid: z.string().nullable().optional(),
  sdpMLineIndex: z.number().int().nullable().optional(),
  usernameFragment: z.string().nullable().optional(),
});

export const clientHelloSchema = z.object({
  type: z.literal("hello"),
  deviceId: z.string().uuid(),
  deviceSecret: z.string().min(1).max(256),
  sessionId: z.string().min(1).max(120),
});

export const clientOfferSchema = z.object({
  type: z.literal("offer"),
  toDeviceId: z.string().uuid(),
  sdp: sdpSchema,
});

export const clientAnswerSchema = z.object({
  type: z.literal("answer"),
  toDeviceId: z.string().uuid(),
  sdp: sdpSchema,
});

export const clientCandidateSchema = z.object({
  type: z.literal("candidate"),
  toDeviceId: z.string().uuid(),
  candidate: iceCandidateSchema,
});

export const clientLeaveSchema = z.object({
  type: z.literal("leave"),
  toDeviceId: z.string().uuid().optional(),
});

export const clientRecordingStateSchema = z.object({
  type: z.literal("recording-state"),
  isRecording: z.boolean(),
});

export const clientMessageSchema = z.discriminatedUnion("type", [
  clientHelloSchema,
  clientOfferSchema,
  clientAnswerSchema,
  clientCandidateSchema,
  clientLeaveSchema,
  clientRecordingStateSchema,
]);
export type ClientMessage = z.infer<typeof clientMessageSchema>;

export type ServerMessage =
  | { type: "ready"; cameras?: Array<{ id: string; name: string }> }
  | { type: "peer-online"; deviceId: string; role: "camera" | "viewer"; name: string }
  | { type: "peer-offline"; deviceId: string }
  | { type: "offer"; fromDeviceId: string; sdp: { type: string; sdp: string } }
  | { type: "answer"; fromDeviceId: string; sdp: { type: string; sdp: string } }
  | { type: "candidate"; fromDeviceId: string; candidate: unknown }
  | { type: "error"; code: string; message: string };
