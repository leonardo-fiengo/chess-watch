(function (root) {
  'use strict';
  var backdrop = document.getElementById('modal-backdrop');
  var dialog = document.getElementById('dialog');
  var previousFocus = null;
  var closeCallback = null;
  function hide() {
    if (backdrop.hidden) return;
    backdrop.hidden = true;
    var callback = closeCallback;
    closeCallback = null;
    if (callback) callback();
    if (previousFocus && document.contains(previousFocus)) previousFocus.focus();
  }
  function show(title, html, actions, onClose) {
    if (!backdrop.hidden) hide();
    previousFocus = document.activeElement;
    document.getElementById('dialog-title').textContent = title;
    document.getElementById('dialog-content').innerHTML = html;
    var buttons = document.getElementById('dialog-actions');
    buttons.innerHTML = '';
    (actions || []).forEach(function (action) {
      var button = document.createElement('button');
      button.className = 'button ' + (action.primary ? 'button-primary' : 'button-outline');
      button.textContent = action.label;
      button.addEventListener('click',function () { hide(); if (action.run) action.run(); });
      buttons.appendChild(button);
    });
    closeCallback = onClose || null;
    backdrop.hidden = false;
    dialog.scrollTop = 0;
    document.getElementById('dialog-close').focus();
  }
  document.getElementById('dialog-close').addEventListener('click',hide);
  backdrop.addEventListener('click',function (event) { if (event.target === backdrop) hide(); });
  dialog.addEventListener('keydown',function (event) {
    if (event.key !== 'Tab') return;
    var controls = dialog.querySelectorAll('button:not([disabled]), a[href], input');
    var first = controls[0], last = controls[controls.length-1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  root.OrbitDialog = {show:show,hide:hide,isOpen:function () { return !backdrop.hidden; }};
}(window));
