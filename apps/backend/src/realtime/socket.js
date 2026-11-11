const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const config = require("../config");
const { prisma } = require("../lib/prisma");
const {
  parseCookies,
  validateSessionToken,
  SESSION_COOKIE_NAME,
} = require("../utils/sessionCookie");

let io = null;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: config.cors?.allowedOrigins || [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
      ],
      credentials: true,
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
    maxHttpBufferSize: 1e6, // 1MB payload ceiling
  });

  // Authentication Middleware on Handshake
  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      const cookies = parseCookies(cookieHeader);
      const sessionToken = cookies[SESSION_COOKIE_NAME] || socket.handshake.auth?.sessionToken;

      if (sessionToken) {
        const validation = await validateSessionToken(sessionToken);
        if (validation.valid && validation.user) {
          socket.user = {
            id: validation.user.id,
            email: validation.user.email,
            role: validation.user.role,
            name: validation.user.name,
          };
          return next();
        }
      }

      // Fallback Bearer token in handshake auth or headers
      const bearer =
        socket.handshake.auth?.token ||
        socket.handshake.headers.authorization?.replace(/^Bearer\s+/, "");

      if (bearer) {
        const decoded = jwt.verify(bearer, config.jwt.secret, {
          algorithms: ["HS256"],
        });
        const userId = decoded.id || decoded.sub || decoded.userId;
        if (userId) {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, role: true, name: true, status: true },
          });

          if (user && user.status === "ACTIVE") {
            socket.user = {
              id: user.id,
              email: user.email,
              role: user.role,
              name: user.name,
            };
            return next();
          }
        }
      }

      return next(new Error("Authentication failed: valid session required."));
    } catch (err) {
      return next(new Error("Authentication failed: invalid credentials."));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user.id;

    // Join private user room for targeted notifications
    socket.join(`user:${userId}`);

    // Join collaborative project room with strict server-side authorization check
    socket.on("join_project", async (projectId) => {
      if (!projectId || typeof projectId !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(projectId)) {
        return socket.emit("error", { message: "Invalid project identifier." });
      }

      try {
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          select: { id: true, isDemo: true, ownerId: true },
        });

        if (!project) {
          return socket.emit("error", { message: "Project not found." });
        }

        const isOwner = project.ownerId === socket.user.id;
        const isAdmin = socket.user.role === "ADMIN";
        const isDemo = Boolean(project.isDemo);

        let isMember = false;
        if (!isOwner && !isAdmin && !isDemo) {
          const membership = await prisma.projectMember.findFirst({
            where: { projectId, userId: socket.user.id },
            select: { id: true },
          });
          isMember = Boolean(membership);
        }

        if (isOwner || isAdmin || isDemo || isMember) {
          socket.join(`project:${projectId}`);
          socket.emit("joined_project", { projectId });
        } else {
          socket.emit("error", {
            code: "FORBIDDEN",
            message: "Unauthorized project room subscription.",
          });
        }
      } catch (err) {
        console.warn(`[SocketIO] Error joining project ${projectId}:`, err.message);
      }
    });

    // Leave project room
    socket.on("leave_project", (projectId) => {
      if (typeof projectId === "string") {
        socket.leave(`project:${projectId}`);
      }
    });

    // Disconnect cleanup
    socket.on("disconnect", () => {
      // Automatic cleanup
    });
  });

  return io;
}

/**
 * Emit event to a specific user's private socket room
 */
function emitToUser(userId, event, data) {
  if (io && userId) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

/**
 * Emit collaborative update to project room
 */
function emitToProject(projectId, event, data) {
  if (io && projectId) {
    io.to(`project:${projectId}`).emit(event, data);
  }
}

function getIO() {
  return io;
}

module.exports = {
  initSocket,
  emitToUser,
  emitToProject,
  getIO,
};
