const { AccessError } = require("./admin-auth.cjs");

function createAdminTV(db, now = Date.now) {
  return {
    async list() {
      const snapshot = await db
        .collection("tv_sessions")
        .where("status", "==", "active")
        .limit(500)
        .get();
      return {
        sessions: snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            accountUid: doc.id,
            sessionId: data.sessionId,
            deviceName: data.deviceName || "TV",
            connectedAt: data.connectedAt || null,
          };
        }),
      };
    },
    async unpair({ accountUid, sessionId }) {
      if (
        typeof accountUid !== "string" ||
        !/^[^/]{1,128}$/.test(accountUid) ||
        typeof sessionId !== "string" ||
        !sessionId ||
        sessionId.length > 200
      )
        throw new AccessError(400, "Choose a connected TV.");
      const ref = db.doc("tv_sessions/" + accountUid);
      await db.runTransaction(async (tx) => {
        const snapshot = await tx.get(ref),
          active = snapshot.data();
        if (!active) throw new AccessError(404, "This TV is no longer paired.");
        if (active.sessionId !== sessionId)
          throw new AccessError(
            409,
            "The connected TV changed. Refresh and review it again.",
          );
        if (active.status !== "active") return;
        tx.update(ref, { status: "signed_out", signedOutAt: now() });
      });
      return { unpaired: true };
    },
  };
}
module.exports = { createAdminTV };
