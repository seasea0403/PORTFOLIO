/* 交互逻辑：渲染内容、作品弹层、桌面端拖拽摆放 */
(function () {
  "use strict";

  var data = window.SITE_DATA || SITE_DATA;

  /* ---------- 渲染文本内容 ---------- */
  document.getElementById("profile-avatar").src = data.profile.avatar;
  document.getElementById("profile-name").textContent = data.profile.name;
  document.getElementById("profile-title").textContent = data.profile.title;
  document.getElementById("profile-tagline").textContent = data.profile.tagline;
  document.getElementById("contact-wechat").textContent = data.contact.wechat;
  document.getElementById("work-count").textContent = "共 " + data.works.length + " 件";

  /* ---------- 生成便签 ---------- */
  var board = document.getElementById("board");
  var noteTemplate = document.getElementById("note-template");
  var noteSpots = [
    { x: "10%", y: "62%", r: "3deg" },
    { x: "44%", y: "66%", r: "-2.5deg" },
    { x: "76%", y: "58%", r: "2deg" },
  ];

  data.notes.forEach(function (text, i) {
    var node = noteTemplate.content.firstElementChild.cloneNode(true);
    var spot = noteSpots[i % noteSpots.length];
    node.style.setProperty("--x", spot.x);
    node.style.setProperty("--y", spot.y);
    node.style.setProperty("--r", spot.r);
    node.querySelector(".note-text").textContent = text;
    board.appendChild(node);
  });

  /* ---------- 入场动画错峰 ---------- */
  var items = Array.prototype.slice.call(board.querySelectorAll(".item"));
  items.forEach(function (el, i) {
    el.style.animationDelay = i * 0.12 + "s";
  });

  /* ---------- 作品弹层 ---------- */
  var modal = document.getElementById("works-modal");
  var worksGrid = document.getElementById("works-grid");
  var workTemplate = document.getElementById("work-template");

  data.works.forEach(function (work) {
    var node = workTemplate.content.firstElementChild.cloneNode(true);
    var cover = node.querySelector(".work-cover");
    cover.src = work.cover;
    cover.alt = work.title;
    node.querySelector(".work-title").textContent = work.title;
    node.querySelector(".work-desc").textContent = work.desc;
    worksGrid.appendChild(node);
  });

  function openModal() { modal.hidden = false; }
  function closeModal() { modal.hidden = true; }

  modal.addEventListener("click", function (e) {
    if (e.target.hasAttribute("data-close")) closeModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });

  /* ---------- 拖拽摆放（仅桌面端） ---------- */
  var DRAG_THRESHOLD = 5;

  function isDesktop() {
    return window.matchMedia("(min-width: 721px)").matches;
  }

  items.forEach(function (el) {
    var startX = 0, startY = 0, baseLeft = 0, baseTop = 0;
    var moved = false, active = false;

    el.addEventListener("pointerdown", function (e) {
      if (!isDesktop() || e.button !== 0) return;
      active = true;
      moved = false;
      startX = e.clientX;
      startY = e.clientY;

      // 把百分比定位换算成像素，作为拖拽起点
      var boardRect = board.getBoundingClientRect();
      var rect = el.getBoundingClientRect();
      baseLeft = rect.left - boardRect.left;
      baseTop = rect.top - boardRect.top;
      el.style.left = baseLeft + "px";
      el.style.top = baseTop + "px";
    });

    el.addEventListener("pointermove", function (e) {
      if (!active) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      if (!moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      if (!moved) {
        moved = true;
        el.classList.add("dragging");
        el.setPointerCapture(e.pointerId);
      }
      var maxX = board.clientWidth - el.offsetWidth;
      var maxY = board.clientHeight - el.offsetHeight;
      el.style.left = Math.max(0, Math.min(maxX, baseLeft + dx)) + "px";
      el.style.top = Math.max(0, Math.min(maxY, baseTop + dy)) + "px";
    });

    function endDrag() {
      active = false;
      el.classList.remove("dragging");
    }
    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);

    // 拖拽结束后标记一下，让随后的 click 被忽略，避免误触文件夹弹层
    el.addEventListener("click", function () {
      if (moved) {
        el.__dragged = true;
        moved = false;
      }
    }, true);
  });

  /* ---------- 文件夹：点击打开作品弹层 ---------- */
  var folder = board.querySelector('[data-item="folder"]');
  folder.addEventListener("click", function () {
    if (folder.__dragged) {
      folder.__dragged = false;
      return;
    }
    openModal();
  });
  folder.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openModal();
    }
  });
})();
