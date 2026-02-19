(function() {
    'use strict';

    const BOARD_PATH = "Canvas/Screens/GameScreen/FakeBoard/PiecesParent";
    const HIDDEN_FRAMES = ["default_role_u_r", "null"];
    const REVEALED_PAT = /^default_role_/i; // catch any revealed

    const knownFrames = new Map();

    function isOpponentSlot(idx) {
        return idx < 40; // top half opponent
    }

    let intervalId = null;
    let rafId = null;

    function enforce() {
        const board = cc.find(BOARD_PATH);
        if (!board) return;

        board.children.forEach((slot, idx) => {
            if (!isOpponentSlot(idx)) return;

            if (slot.children.length === 0) return;
            const piece = slot.children[0];
            const uuid = piece.uuid;

            const iconSprite = piece.getComponentsInChildren(cc.Sprite).find(s => s.node.name === "Base Icon Sprite");
            if (!iconSprite) return;

            const current = iconSprite.spriteFrame?.name || "null";

            // Memo/update if revealed (allow update if rank changes)
            if (REVEALED_PAT.test(current) && !HIDDEN_FRAMES.includes(current)) {
                const existing = knownFrames.get(uuid);
                if (!existing || existing.rankStr !== current) {
                    knownFrames.set(uuid, {
                        frame: iconSprite.spriteFrame.clone(),
                        rankStr: current
                    });
                    console.log(`[kinobau.dev] Piece ${uuid.slice(-8)} slot ${idx}: ${current}`);
                }
            }

            // Force for known opponent pieces
            const known = knownFrames.get(uuid);
            if (known) {
                if (iconSprite.spriteFrame?.name !== known.rankStr) {
                    iconSprite.spriteFrame = known.frame;
                }

                piece.active = true;
                piece.opacity = 255;
                if (iconSprite.node) {
                    iconSprite.node.active = true;
                    iconSprite.node.opacity = 255;
                }

                // Redraw
                if (piece._renderFlag !== undefined) {
                    piece._renderFlag |= cc.RenderFlow.FLAG_UPDATE_RENDER_DATA;
                }

                // Log only first force per piece
                if (!piece._v9_logged) {
                    console.log(`[kinobau.dev] Piece ${uuid.slice(-8)}: restored ${known.rankStr}, visible forced`);
                    piece._v9_logged = true;
                }
            }
        });
    }

    function rafLoop() {
        enforce();
        rafId = requestAnimationFrame(rafLoop);
    }
    rafLoop();

    intervalId = setInterval(enforce, 10); // backup

    console.log("[kinobau.dev] Started");

    window.v9stop = () => {
        clearInterval(intervalId);
        cancelAnimationFrame(rafId);
    };

    window.v9clear = () => {
        knownFrames.clear();
        console.log("[kinobau.dev] All memos cleared");
    };
})();
