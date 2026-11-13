// npm install --no-save --package-lock=false jsdom@26.1.0
// Integration wiring tests, not browser layout, real media policy, or audible playback.
const {JSDOM}=require('jsdom');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const settle=()=>new Promise(resolve=>setTimeout(resolve,30));
function setup(blockAutoplay){
 const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url:'https://example.test/guardians-above/',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,d=w.document;w.scrollTo=()=>{};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 const state={paused:true,blocked:blockAutoplay,calls:0,deferred:null};
 Object.defineProperty(w.HTMLMediaElement.prototype,'paused',{get(){return state.paused;}});
 w.HTMLMediaElement.prototype.play=function(){state.calls++;if(state.blocked){const error=new Error('Autoplay blocked');error.name='NotAllowedError';return Promise.reject(error);}if(state.deferred)return state.deferred;state.paused=false;this.dispatchEvent(new w.Event('play'));return Promise.resolve();};
 w.HTMLMediaElement.prototype.pause=function(){state.paused=true;this.dispatchEvent(new w.Event('pause'));};
 const errors=[];w.addEventListener('error',event=>errors.push(event.error));
 w.eval(fs.readFileSync(path.join(root,'script.js'),'utf8'));
 const $=s=>d.querySelector(s),click=s=>$(s).click();
 return {w,d,state,errors,$,click,close:()=>w.close()};
}
(async()=>{
 const app=setup(true),{w,d,state,errors,$,click}=app;
 await settle();assert.equal(state.calls,1,'Autoplay must be attempted on entry');assert.equal(state.paused,true);assert.match($('#music-status').textContent,/자동재생/);
 assert.equal($('.sound-panel'),null);assert.equal($('.hotspot'),null);assert.equal(d.querySelector('input[type=range]'),null);assert.equal($('#music-time'),null);
 assert.equal(d.querySelectorAll('.scene:not([hidden])').length,1);assert.equal($('#previous').disabled,true);
 assert.match($('[data-layered="1"] .imagined-character').src,/guardian-A02.webp(?:\?.*)?$/);
 click('[data-go]');await settle();assert.equal($('#observe').hidden,false);assert.equal(d.activeElement.id,'observe-title');assert.equal($('#progress').value,2);
 assert.equal(d.querySelectorAll('.layered-scene [data-detail]').length,0,'Observation controls must never cover the image');
 click('[data-detail="eye"]');assert.match($('#detail-title').textContent,/눈/);assert.equal($('[data-detail="eye"]').getAttribute('aria-pressed'),'true');
 $('#detail-zoom').focus();click('#detail-zoom');assert.equal($('#viewer').open,true);assert.match($('#viewer-title').textContent,/정내902/);assert.equal($('#zoom-level').textContent,'200%');assert.match($('#viewer-observation').textContent,/두 눈/);
 click('#zoom-in');assert.equal($('#zoom-level').textContent,'225%');click('#zoom-reset');assert.equal($('#zoom-level').textContent,'100%');
 click('#original-toggle');assert.equal($('.viewer-viewport').classList.contains('show-original'),true);click('#original-toggle');assert.equal($('.viewer-viewport').classList.contains('show-original'),false);
 click('#viewer [data-close]');assert.equal(d.activeElement.id,'detail-zoom');
 const observationBase=$('[data-layered="0"] .imagined-character').src;
 const observationGeometry=$('[data-layered="0"] .tile-overlay').getAttribute('style');
 assert.match($('#observe .character-design-note').textContent,/둥근 몸통|넓은 몸통/);
 const tile=$('[data-layered="0"] .tile-overlay');tile.focus();tile.click();assert.match($('#viewer-title').textContent,/정내902/);click('#viewer [data-close]');assert.equal(d.activeElement,tile);
 const toggle=$('#observe [data-layer-toggle]');toggle.click();assert.equal(tile.hidden,true);toggle.click();assert.equal(tile.hidden,false);
 const guardianButton=$('#observe [data-guardian]');guardianButton.focus();guardianButton.click();assert.match($('#guardian-title').textContent,/정내902/);assert.equal($('.guardian-viewport .imagined-character').src,observationBase);
 click('#guardian-plus');assert.equal($('#guardian-scale').textContent,'125%');click('#guardian-reset');assert.equal($('#guardian-scale').textContent,'100%');
 click('#guardian-layer-toggle');assert.equal($('.guardian-viewport .tile-overlay').hidden,true);click('#guardian-layer-toggle');
 click('#guardian-source');assert.equal($('#guardian-dialog').open,false);assert.match($('#viewer-title').textContent,/정내902/);click('#viewer [data-close]');assert.equal(d.activeElement,guardianButton);
 w.location.hash='#compare';await settle();assert.equal($('#compare').hidden,false);
 assert.equal($('#left-image .imagined-character').src,observationBase,'A01 must use the same image in observation and comparison');
 assert.equal($('#left-image .tile-overlay').getAttribute('style'),observationGeometry,'The overlay placement must also match');
 const assets=['guardian-A01.webp','guardian-A02.webp','guardian-A03.webp'];
 for(let index=0;index<3;index++){
  $('#left-select').value=String(index);$('#left-select').dispatchEvent(new w.Event('change'));
  assert.ok(new URL($('#left-image .imagined-character').src).pathname.endsWith(assets[index]));assert.match($('#left-info .character-design-note').textContent,/기와에서 이어진 형태/);assert.ok($('#left-image .overlaid-artifact').src.endsWith(`A0${index+1}.jpg`));
  click('#left-image .tile-overlay');assert.match($('#viewer-title').textContent,new RegExp(['정내902','정내894','정내1031'][index]));click('#viewer [data-close]');
 }
 $('#left-select').value='0';$('#left-select').dispatchEvent(new w.Event('change'));
 $('#right-select').value='0';$('#right-select').dispatchEvent(new w.Event('change'));assert.equal($('#left-image .imagined-character').src,$('#right-image .imagined-character').src);assert.match($('#comparison-note').textContent,/같은 캐릭터/);
 click('[data-side-toggle="left"]');assert.equal($('#left-image .tile-overlay').hidden,true);assert.equal($('#right-image .tile-overlay').hidden,false);
 click('[data-scale="left:0.25"]');assert.equal($('#left-scale').textContent,'125%');click('#reset-compare');assert.equal($('#left-scale').textContent,'100%');assert.equal($('#right-select').value,'2');assert.equal($('#left-image .tile-overlay').hidden,false);
 click('[data-side-guardian="right"]');assert.match($('#guardian-title').textContent,/정내1031/);click('.guardian-viewport .tile-overlay');assert.match($('#viewer-title').textContent,/정내1031/);click('#viewer [data-close]');
 $('#left-image .overlaid-artifact').dispatchEvent(new w.Event('error'));assert.match($('#left-image').textContent,/기와 사진을 불러오지/);assert.equal($('#left-image .tile-overlay').disabled,true);
 click('[data-sources]');assert.equal(d.querySelectorAll('#source-list article').length,3);click('#sources-dialog [data-close]');
 click('#text-size');assert.equal(d.documentElement.classList.contains('large-text'),true);click('#text-size');assert.equal(d.documentElement.classList.contains('large-text'),false);
 click('#motion-toggle');assert.equal(d.body.classList.contains('no-motion'),true);
 // Policy-rejected autoplay falls back to the first gesture, with one shared audio element.
 await settle();const beforeGesture=state.calls;state.blocked=false;$('#compare-title').dispatchEvent(new w.Event('pointerdown',{bubbles:true}));await settle();assert.equal(state.paused,false);assert.equal(state.calls,beforeGesture+1);
 assert.ok([...d.querySelectorAll('[data-music-play]')].every(b=>b.getAttribute('aria-pressed')==='true'));
 $('#exhibition-music').currentTime=25;click('#compare [data-music-stop]');assert.equal(state.paused,true);assert.equal($('#exhibition-music').currentTime,0);assert.equal($('#exhibition-music').autoplay,false);
 const afterStop=state.calls;$('#compare-title').dispatchEvent(new w.Event('pointerdown',{bubbles:true}));await settle();assert.equal(state.calls,afterStop,'A deliberate Stop must suppress future gesture autoplay');
 click('#compare [data-music-play]');await settle();assert.equal(state.paused,false);const playingCalls=state.calls;click('#observe [data-music-play]');await settle();assert.equal(state.calls,playingCalls);
 click('#compare [data-music-stop]');
 let finish;state.deferred=new Promise(resolve=>{finish=resolve;});click('#compare [data-music-play]');assert.equal($('#compare [data-music-play]').getAttribute('aria-busy'),'true');click('#compare [data-music-stop]');finish();await settle();assert.equal(state.paused,true);assert.equal($('#compare [data-music-play]').getAttribute('aria-busy'),'false');state.deferred=null;
 click('#compare [data-music-play]');await settle();Object.defineProperty(d,'hidden',{configurable:true,value:true});d.dispatchEvent(new w.Event('visibilitychange'));assert.equal(state.paused,true);Object.defineProperty(d,'hidden',{configurable:true,value:false});
 $('#exhibition-music').dispatchEvent(new w.Event('error'));assert.match($('#music-status').textContent,/불러오지/);
 w.location.hash='#outro';await settle();assert.equal($('#next').disabled,true);$('#reflection').value='평온';$('#reflection').dispatchEvent(new w.Event('input'));assert.match($('#reflection-status').textContent,/2 \/ 240/);click('#restart');await settle();assert.equal($('#intro').hidden,false);assert.equal($('#reflection').value,'');assert.equal($('[data-detail="eye"]').getAttribute('aria-pressed'),'false');assert.equal($('#observe .tile-overlay').hidden,false);
 w.history.back();await settle();assert.equal($('#outro').hidden,false);assert.equal(errors.length,0,errors.map(String).join('\n'));app.close();
 const allowed=setup(false);await settle();assert.equal(allowed.state.calls,1);assert.equal(allowed.state.paused,false,'Allowed autoplay should begin on entry');assert.equal(allowed.errors.length,0);allowed.close();
 console.log('PASS: all scene navigation, detail selection outside artwork, raw photo viewer, shared character identity and geometry, every comparison choice, overlay visibility, character/source modal transitions and focus, zoom/reset, image failure, sources, large text, reduced motion control, autoplay allowed/rejected, first-gesture fallback, shared Play/Stop, stop seek reset, opt-out, pending cancellation, background pause, restart/history.');
 console.log('LIMIT: jsdom stubs do not validate rendering, native dialog modality, physical touch, audible playback, or actual browser autoplay policy.');
})().catch(error=>{console.error(error);process.exitCode=1;});
