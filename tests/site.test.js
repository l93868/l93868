const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const root = path.join(__dirname, "..");
const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");

test("homepage introduces Tank Liu's tank research report", () => {
  assert.match(indexHtml, /坦克刘的坦克研究汇报/u);
  assert.match(indexHtml, /Tank Research/u);
});

test("homepage exposes seven presentation chapters", () => {
  const expectedChapters = [
    "坦克是怎么诞生的",
    "一战里的第一批坦克",
    "二战让坦克发生了什么变化",
    "为什么各国会造出不同坦克",
    "冷战期间坦克怎么继续发展",
    "俄乌战争说明了什么问题",
    "未来坦克会变成什么样"
  ];

  for (const chapter of expectedChapters) {
    assert.match(indexHtml, new RegExp(chapter, "u"));
  }

  assert.match(indexHtml, /我准备按这 7 个问题来做汇报/u);
});

test("homepage includes report highlights and neutral follow-up labels", () => {
  assert.match(indexHtml, /我汇报的重点/u);
  assert.match(indexHtml, /继续展开看看/u);
  assert.doesNotMatch(indexHtml, /老师/u);
  assert.doesNotMatch(indexHtml, /老教授/u);
});

test("homepage includes updated research goal and speaking approach", () => {
  assert.match(indexHtml, /研究目的/u);
  assert.match(indexHtml, /更好地了解坦克/u);
  assert.match(indexHtml, /科技发展和世界变化之间/u);
  assert.match(indexHtml, /我会先用自己的话把重点讲清楚/u);
});

test("homepage includes local tank model images with source credits", () => {
  const expectedAssets = [
    "assets/images/mark-i.jpg",
    "assets/images/renault-ft.jpg",
    "assets/images/tiger-i.jpg",
    "assets/images/t-34.jpg",
    "assets/images/sherman.jpg",
    "assets/images/little-willie.jpg",
    "assets/images/saint-chamond.jpg",
    "assets/images/panzer-iv.jpg",
    "assets/images/is-2.jpg",
    "assets/images/turtle-tank.jpg"
  ];

  for (const asset of expectedAssets) {
    assert.match(indexHtml, new RegExp(asset.replace(".", "\\."), "u"));
    assert.equal(fs.existsSync(path.join(root, asset)), true);
  }

  assert.match(indexHtml, /图片来源/u);
  assert.match(indexHtml, /Little Willie/u);
  assert.match(indexHtml, /Saint-Chamond/u);
  assert.match(indexHtml, /Panzer IV/u);
  assert.match(indexHtml, /IS-2/u);
  assert.match(indexHtml, /刺猬一样/u);
});

test("homepage uses the redesigned magazine-style presentation shell", () => {
  assert.match(indexHtml, /hero-cover/u);
  assert.match(indexHtml, /editorial-strip/u);
  assert.match(indexHtml, /chapter-showcase/u);
  assert.match(indexHtml, /photo-ribbon/u);
});

test("homepage includes country cards, cold war chapter, and future tank imagery", () => {
  const expectedAssets = [
    "assets/images/centurion.jpg",
    "assets/images/panzer-iv.jpg",
    "assets/images/t-34.jpg",
    "assets/images/sherman.jpg",
    "assets/images/leopard-1.jpg",
    "assets/images/m60-patton.jpg",
    "assets/images/t-14-armata.jpg",
    "assets/images/kf51-panther.jpg"
  ];

  for (const asset of expectedAssets) {
    assert.match(indexHtml, new RegExp(asset.replace(".", "\\."), "u"));
    assert.equal(fs.existsSync(path.join(root, asset)), true);
  }

  assert.match(indexHtml, /冷战期间坦克/u);
  assert.match(indexHtml, /主战坦克/u);
  assert.match(indexHtml, /主动防护/u);
  assert.match(indexHtml, /无人协同/u);
});

test("server returns JPEG content type for local tank images", async () => {
  const port = 4317;
  const child = spawn(process.execPath, ["server.js"], {
    cwd: root,
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"]
  });

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("server did not start in time")), 5000);
    child.stdout.on("data", (chunk) => {
      if (String(chunk).includes(`http://127.0.0.1:${port}`)) {
        clearTimeout(timeout);
        resolve();
      }
    });
    child.once("error", reject);
    child.once("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`server exited early with code ${code}`));
    });
  });

  try {
    const response = await fetch(`http://127.0.0.1:${port}/assets/images/mark-i.jpg`);
    assert.equal(response.headers.get("content-type"), "image/jpeg");
    assert.equal(response.headers.get("cache-control"), "no-store");
  } finally {
    child.kill();
  }
});
