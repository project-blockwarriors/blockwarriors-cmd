import { Server as SocketIOServer } from "socket.io";
import { NextResponse } from "next/server";
import type { Server as HTTPServer } from "http";
import type { Socket as NetSocket } from "net";
import type { NextApiResponse } from "next";

interface SocketServer extends HTTPServer {
  io?: SocketIOServer;
}

interface SocketWithIO extends NetSocket {
  server: SocketServer;
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO;
}

// Store io instance globally
declare global {
  // eslint-disable-next-line no-var
  var io: SocketIOServer | undefined;
}

export async function GET() {
  return NextResponse.json({ message: "Socket.io server initialized via custom server" });
}

export const dynamic = "force-dynamic";
