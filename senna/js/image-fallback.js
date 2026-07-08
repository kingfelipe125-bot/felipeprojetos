/**
 * Auto-detects real photos.
 * Every photo frame in the page is a plain <div data-label="path/relative/to/images.jpg">.
 * If a real file exists at images/<data-label>, it is loaded and shown.
 * If it does not exist yet, the frame keeps showing an honest placeholder
 * (via CSS ::after reading data-desc/data-label) instead of any invented image.
 * This means: drop real, licensed photos into /senna/images/ using the paths
 * listed in images/MANIFEST.md, and they appear automatically — no code changes needed.
 */
(function(){
  function hydrateFrame(frame){
    var rel = frame.getAttribute('data-label');
    if(!rel) return;
    var src = 'images/' + rel;
    var img = new Image();
    img.onload = function(){
      img.alt = frame.getAttribute('data-desc') || '';
      img.draggable = false;
      frame.appendChild(img);
      frame.classList.add('has-photo');

      // Creative Commons / attribution-required photos must keep their credit
      // visible. If the frame carries data-credit, show it as a small caption.
      var credit = frame.getAttribute('data-credit');
      if(credit){
        var cap = document.createElement('span');
        cap.className = 'photo-credit';
        cap.textContent = credit;
        frame.appendChild(cap);
      }
    };
    img.onerror = function(){ /* keep placeholder as-is */ };
    img.src = src;
  }

  function init(){
    document.querySelectorAll('.tl-photo-frame, .car-photo-frame, .helmet-photo-frame').forEach(hydrateFrame);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
