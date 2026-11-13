'use strict';
const objects = [
 {id:'A01',number:'정내902',era:'통일신라',material:'토제 · 연질',size:'너비 22.4cm · 길이 21.1cm · 두께 4.7cm',relic:'164956',alt:'밝은 흙빛의 정내902 귀면와. 둥글게 솟은 두 눈과 윗 테두리의 둥근 돌기가 보인다.',observation:'둥글게 솟은 눈과 윗 테두리의 반복되는 돌기를 찾아보세요.'},
 {id:'A02',number:'정내894',era:'통일신라',material:'토제 · 경질',size:'너비 17.1cm · 길이 19.5cm · 두께 8.3cm',relic:'7123',alt:'짙은 흙빛의 정내894 귀면와. 굴곡진 윤곽과 얼굴의 깊은 입체감이 보인다.',observation:'굴곡진 윤곽과 눈 주변의 깊은 입체감을 살펴보세요.'},
 {id:'A03',number:'정내1031',era:'고려',material:'토제 · 경질',size:'너비 30.4cm · 길이 26cm · 두께 7.4cm',relic:'40093',alt:'정내1031 귀면와. 옆으로 펼쳐진 입과 얼굴 양옆의 둥근 장식이 보인다.',observation:'옆으로 펼쳐진 입과 얼굴 양옆의 둥근 장식을 살펴보세요.'}
];
const officialURL = o => `https://www.museum.go.kr/MUSEUM/contents/M0502000000.do?relicId=${o.relic}&schM=view&searchId=search`;
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const sections = $$('.scene');
const ids = sections.map(s => s.id);
let current = 0;
function navigate(index, focus = true) {
 current = Math.max(0, Math.min(4,index));
 sections.forEach((s,i) => {s.hidden = i !== current;});
 $$('[data-step]').forEach(a => {if(Number(a.dataset.step) === current)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');});
 $('#previous').disabled = current === 0;
 $('#next').disabled = current === 4;
 $('#progress-text').textContent = `${String(current+1).padStart(2,'0')} / 05`;
 $('#progress').value = current+1;
 if(focus){window.scrollTo(0,0);sections[current].querySelector('h1,h2').focus({preventScroll:true});}
}
function go(index){const hash='#'+ids[index];if(location.hash === hash)navigate(index);else location.hash=hash;}
window.addEventListener('hashchange',()=>{const i=ids.indexOf(location.hash.slice(1));navigate(i<0?0:i);});
$$('[data-go]').forEach(b=>b.addEventListener('click',()=>go(Number(b.dataset.go))));
$('#previous').addEventListener('click',()=>go(Math.max(0,current-1)));
$('#next').addEventListener('click',()=>go(Math.min(4,current+1)));
$$('[data-source-link]').forEach(a=>a.href=officialURL(objects[Number(a.dataset.sourceLink)]));
function imageFailure(img){
 if(img.dataset.failed)return;img.dataset.failed='true';
 const holder=document.createElement('p');holder.className='image-error';holder.setAttribute('role','status');holder.textContent='원본 자료 준비 중 — 사진을 불러오지 못했습니다. 소장품 원문 링크에서 자료를 확인해 주세요.';
 img.hidden=true;img.after(holder);
 const region=img.closest('.observation-photo');if(region)region.querySelectorAll('.hotspot').forEach(b=>b.hidden=true);
}
function protectImage(img){img.addEventListener('error',()=>imageFailure(img),{once:true});if(img.complete && img.naturalWidth===0)imageFailure(img);}
$$('img').forEach(protectImage);
const details={eye:{title:'01. 둥글게 솟은 눈',copy:'두 눈의 중심이 둥글게 솟아 있습니다. 눈 주변을 감싼 선과 얼굴 표면의 높낮이를 함께 살펴보세요.',x:.45,y:.47},mouth:{title:'02. 입 주변의 선',copy:'코 아래에서 입 주변으로 이어지는 돌출된 선이 보입니다. 양쪽의 모양이 어떻게 마주하고 있는지 관찰해 보세요.',x:.51,y:.59},rim:{title:'03. 반복되는 테두리',copy:'얼굴의 윗 테두리를 따라 둥근 돌기가 반복됩니다. 얼굴 안쪽의 선과 바깥쪽 장식은 어떻게 다르게 보이나요?',x:.52,y:.25}};
let selectedDetail=null;
$$('[data-detail]').forEach(b=>b.addEventListener('click',()=>{selectedDetail=b.dataset.detail;const d=details[selectedDetail];$('#detail-title').textContent=d.title;$('#detail-copy').textContent=d.copy;$$('.hotspot').forEach(h=>h.setAttribute('aria-pressed',String(h.dataset.detail===selectedDetail)));$('#detail-zoom').textContent='선택한 부위 확대 ↗';}));
const sideState={left:{index:0,scale:1},right:{index:2,scale:1}};
function renderSide(side){
 const state=sideState[side],o=objects[state.index];
 const holder=$(`#${side}-image`);holder.replaceChildren();
 const img=document.createElement('img');img.src=`./assets/${o.id}.jpg`;img.alt=o.alt;holder.append(img);protectImage(img);
 $(`#${side}-info`).innerHTML=`<span class="label">${o.era} · ${o.number}</span><h3>도깨비얼굴무늬 기와</h3><p>${o.material}<br>${o.size}</p><p><span class="label">사진 관찰</span><br>${o.observation}</p><a href="${officialURL(o)}" target="_blank" rel="noopener">사진 © 국립중앙박물관 · 공공누리 제1유형 · 원문 ↗</a>`;
 $(`#${side}-select`).value=String(state.index);scaleSide(side,0);
 $('#comparison-note').textContent=sideState.left.index===sideState.right.index?'같은 작품을 선택했습니다. 다른 작품을 골라 형태를 비교할 수도 있습니다.':'눈과 입의 모양, 얼굴 바깥 윤곽에서 무엇이 다르게 보이나요?';
}
function scaleSide(side,delta){const state=sideState[side];state.scale=Math.min(3,Math.max(1,state.scale+delta));const img=$(`#${side}-image img`);if(img){img.style.width=`${state.scale*100}%`;img.style.height=`${state.scale*100}%`;}$(`#${side}-scale`).textContent=`${Math.round(state.scale*100)}%`;$$(`[data-scale^="${side}:"]`).forEach(b=>b.disabled=Number(b.dataset.scale.split(':')[1])<0?state.scale===1:state.scale===3);}
Object.keys(sideState).forEach(side=>{const select=$(`#${side}-select`);objects.forEach((o,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=`${o.number} · ${o.era}`;select.append(option);});select.addEventListener('change',()=>{sideState[side]={index:Number(select.value),scale:1};renderSide(side);});renderSide(side);});
$$('[data-scale]').forEach(b=>b.addEventListener('click',()=>{const [side,delta]=b.dataset.scale.split(':');scaleSide(side,Number(delta));}));
function resetComparison(){sideState.left={index:0,scale:1};sideState.right={index:2,scale:1};renderSide('left');renderSide('right');}
$('#reset-compare').addEventListener('click',resetComparison);
let dialogOpener=null,viewerScale=1;
function openDialog(dialog){dialogOpener=document.activeElement;dialog.showModal();dialog.querySelector('[data-close]').focus();}
$$('dialog').forEach(dialog=>{
 dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
 dialog.addEventListener('close',()=>{if(dialogOpener?.isConnected)dialogOpener.focus({preventScroll:true});});
});
function scaleViewer(delta){viewerScale=Math.max(1,Math.min(4,viewerScale+delta));const img=$('#viewer-image');img.style.width=`${viewerScale*100}%`;img.style.height=`${viewerScale*100}%`;$('#zoom-level').textContent=`${Math.round(viewerScale*100)}%`;$('#zoom-out').disabled=viewerScale===1;$('#zoom-in').disabled=viewerScale===4;}
function openViewer(index,detail=null){
 const o=objects[index],old=$('#viewer-image'),img=document.createElement('img');img.id='viewer-image';img.alt=o.alt;img.src=`./assets/${o.id}.jpg`;old.replaceWith(img);$$('.viewer-viewport .image-error').forEach(p=>p.remove());protectImage(img);
 $('#viewer-title').textContent=`도깨비얼굴무늬 기와 · ${o.number}`;
 $('#viewer-caption').replaceChildren(document.createTextNode(`${o.era} · ${o.size} · 사진 © 국립중앙박물관 · 공공누리 제1유형 · `));
 const link=document.createElement('a');link.href=officialURL(o);link.target='_blank';link.rel='noopener';link.textContent='소장품 원문 ↗';$('#viewer-caption').append(link);
 viewerScale=1;scaleViewer(detail?1:0);openDialog($('#viewer'));
 const viewport=$('.viewer-viewport');viewport.scrollTop=0;viewport.scrollLeft=0;
 if(detail){requestAnimationFrame(()=>{viewport.scrollLeft=viewport.scrollWidth*detail.x-viewport.clientWidth/2;viewport.scrollTop=viewport.scrollHeight*detail.y-viewport.clientHeight/2;});}
}
$$('[data-view]').forEach(b=>b.addEventListener('click',()=>openViewer(Number(b.dataset.view),b.id==='detail-zoom'&&selectedDetail?details[selectedDetail]:null)));
$$('[data-side-view]').forEach(b=>b.addEventListener('click',()=>openViewer(sideState[b.dataset.sideView].index)));
$('#zoom-in').addEventListener('click',()=>scaleViewer(.25));$('#zoom-out').addEventListener('click',()=>scaleViewer(-.25));$('#zoom-reset').addEventListener('click',()=>{viewerScale=1;scaleViewer(0);$('.viewer-viewport').scrollTop=0;$('.viewer-viewport').scrollLeft=0;});
$('#source-list').innerHTML=objects.map(o=>`<article><h3>${o.number} · 도깨비얼굴무늬 기와</h3><p>${o.era} · ${o.material}<br>${o.size}</p><a href="${officialURL(o)}" target="_blank" rel="noopener">국립중앙박물관 소장품 원문 ↗</a></article>`).join('');
$$('[data-sources]').forEach(b=>b.addEventListener('click',()=>openDialog($('#sources-dialog'))));
$('#reflection').addEventListener('input',()=>{$('#reflection-status').textContent=`${$('#reflection').value.length} / 240자 · 이 기록은 화면을 새로 열면 사라집니다.`;});
$('#restart').addEventListener('click',()=>{selectedDetail=null;$('#detail-title').textContent='얼굴에 남은 세 가지 단서';$('#detail-copy').textContent='사진 위 숫자를 선택해 보세요. 눈, 입, 테두리에서 눈에 띄는 모양을 찾아봅니다.';$$('.hotspot').forEach(h=>h.setAttribute('aria-pressed','false'));$('#detail-zoom').textContent='사진 확대 ↗';resetComparison();$$('input[name=impression]').forEach(i=>i.checked=false);$('#reflection').value='';$('#reflection-status').textContent='기록은 서버에 전송되거나 영구 저장되지 않습니다.';go(0);});
navigate(Math.max(0,ids.indexOf(location.hash.slice(1))),false);

$('#motion-toggle').addEventListener('click',()=>{const disabled=document.body.classList.toggle('no-motion');$('#motion-toggle').setAttribute('aria-pressed',String(disabled));$('#motion-toggle').textContent=disabled?'화면 효과 켜기':'화면 효과 끄기';});

// Reading size is a reversible preference; it does not alter the collection data.
$('#text-size').addEventListener('click',()=>{
 const large=document.documentElement.classList.toggle('large-text');
 $('#text-size').setAttribute('aria-pressed',String(large));
 $('#text-size').textContent=large?'기본 글씨':'큰 글씨';
});
$$('[data-detail]').forEach(button=>button.addEventListener('click',()=>{
 const panel=$('.observation-text');
 panel.classList.remove('detail-updated');
 requestAnimationFrame(()=>panel.classList.add('detail-updated'));
}));

// Local original audio, opt-in only. Browsers may reject play(); navigation stays usable.
const music=$('#exhibition-music');
const musicToggle=$('#music-toggle');
const musicStatus=$('#music-status');
let musicOperation=0;
let musicPending=false;
music.volume=.25;
function updateMusicButton(){
 const playing=!music.paused;
 musicToggle.setAttribute('aria-pressed',String(playing));
 musicToggle.disabled=musicPending;
 musicToggle.textContent=musicPending?'음악 불러오는 중…':playing?'배경음악 일시정지':'배경음악 재생';
}
musicToggle.addEventListener('click',async()=>{
 if(musicPending)return;
 if(!music.paused){
  ++musicOperation;music.pause();musicStatus.textContent='배경음악이 일시정지되었습니다.';updateMusicButton();return;
 }
 const operation=++musicOperation;
 musicPending=true;updateMusicButton();
 try{
  await music.play();
  if(operation!==musicOperation)return;
  if(document.hidden){music.pause();return;}
  musicStatus.textContent='재생 중 · 지붕 위의 고요 · 다른 탭으로 이동하면 일시정지합니다.';
 }catch(error){
  if(operation===musicOperation)musicStatus.textContent='음악을 재생하지 못했습니다. 재생 버튼을 다시 눌러 주세요. 전시 관람은 계속할 수 있습니다.';
 }finally{
  if(operation===musicOperation){musicPending=false;updateMusicButton();}
 }
});
$('#music-volume').addEventListener('input',event=>{
 const volume=Math.max(0,Math.min(100,Number(event.target.value)));
 music.volume=volume/100;
 $('#music-volume-value').textContent=`${volume}%`;
 event.target.setAttribute('aria-valuetext',`${volume}퍼센트`);
});
music.addEventListener('play',updateMusicButton);
music.addEventListener('pause',updateMusicButton);
music.addEventListener('error',()=>{
 ++musicOperation;musicPending=false;music.pause();updateMusicButton();
 musicStatus.textContent='음악 파일을 불러오지 못했습니다. 전시 관람은 계속할 수 있습니다.';
});
function pauseBackgroundMusic(){
 const wasActive=!music.paused||musicPending;
 ++musicOperation;musicPending=false;music.pause();updateMusicButton();
 if(wasActive)musicStatus.textContent='화면을 벗어나 음악을 일시정지했습니다. 재생 버튼으로 다시 시작할 수 있습니다.';
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseBackgroundMusic();});
window.addEventListener('pagehide',pauseBackgroundMusic);
