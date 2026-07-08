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
