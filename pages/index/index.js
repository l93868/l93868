const { ROLE_LIBRARY, TinyTankWorld } = require("../../game/tiny-tank-world");

Page({
  data: {
    ready: false,
    status: "loading",
    chapterText: "Ready",
    missionTitle: "Tiny Tank World",
    missionHint: "Loading map",
    allyCount: 0,
    enemyCount: 0,
    playerHpText: "HP -- / --",
    mapButtonText: "Map",
    roleName: ROLE_LIBRARY[0].name,
    roleSummary: ROLE_LIBRARY[0].summary,
    roleTip: ROLE_LIBRARY[0].tip,
    skillName: ROLE_LIBRARY[0].skillName,
    superName: ROLE_LIBRARY[0].superName,
    dialogTitle: "Big Map Tank Adventure",
    dialogCopy: "A simple tank game prototype for kids. Move, auto aim, use one skill, and explore a very large map with your team.",
    primaryButtonText: "Start"
  },

  onReady() {
    const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    wx.createSelectorQuery()
      .select("#gameCanvas")
      .fields({ node: true, size: true })
      .exec((result) => {
        const canvasInfo = result && result[0];
        if (!canvasInfo || !canvasInfo.node) {
          wx.showToast({ title: "Canvas error", icon: "none" });
          return;
        }

        const canvas = canvasInfo.node;
        const dpr = windowInfo.pixelRatio || 1;
        canvas.width = canvasInfo.width * dpr;
        canvas.height = canvasInfo.height * dpr;

        const ctx = canvas.getContext("2d");
        this.game = new TinyTankWorld({
          canvas,
          ctx,
          width: canvasInfo.width,
          height: canvasInfo.height,
          dpr,
          onUiChange: this.handleUiChange.bind(this)
        });

        this.game.start();
        this.setData({
          ready: true,
          status: "menu"
        });
      });
  },

  onHide() {
    if (this.game) {
      this.game.setPaused(true);
    }
  },

  onShow() {
    if (this.game) {
      this.game.setPaused(false);
    }
  },

  onUnload() {
    if (this.game) {
      this.game.destroy();
      this.game = null;
    }
  },

  handleUiChange(nextState) {
    this.setData(nextState);
  },

  handlePrimaryAction() {
    if (!this.game) {
      return;
    }

    const status = this.data.status;
    if (status === "menu") {
      this.game.startAdventure();
    } else if (status === "stage-clear") {
      this.game.nextStage();
    } else if (status === "won" || status === "lost") {
      this.game.restart();
    }
  },

  handleCycleRole() {
    if (this.game) {
      this.game.cycleRole();
    }
  },

  handleToggleMap() {
    if (this.game) {
      this.game.toggleOverview();
    }
  },

  handleSkill() {
    if (this.game) {
      this.game.usePlayerSkill(false);
    }
  },

  handleSuper() {
    if (this.game) {
      this.game.usePlayerSkill(true);
    }
  },

  handleDirStart(event) {
    if (this.game) {
      this.game.setInput(event.currentTarget.dataset.key, true);
    }
  },

  handleDirEnd(event) {
    if (this.game) {
      this.game.setInput(event.currentTarget.dataset.key, false);
    }
  }
});
