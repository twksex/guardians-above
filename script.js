'use strict';
const objects = [
 {id:'A01',width:3000,height:2000,number:'정내902',era:'통일신라',material:'토제 · 연질',size:'너비 22.4cm · 길이 21.1cm · 두께 4.7cm',relic:'164956',alt:'밝은 흙빛의 정내902 귀면와. 둥글게 솟은 두 눈과 윗 테두리의 둥근 돌기가 보인다.',observation:'둥글게 솟은 눈과 윗 테두리의 반복되는 돌기를 찾아보세요.'},
 {id:'A02',width:618,height:600,number:'정내894',era:'통일신라',material:'토제 · 경질',size:'너비 17.1cm · 길이 19.5cm · 두께 8.3cm',relic:'7123',alt:'짙은 흙빛의 정내894 귀면와. 굴곡진 윤곽과 얼굴의 깊은 입체감이 보인다.',observation:'굴곡진 윤곽과 눈 주변의 깊은 입체감을 살펴보세요.'},
 {id:'A03',width:668,height:515,number:'정내1031',era:'고려',material:'토제 · 경질',size:'너비 30.4cm · 길이 26cm · 두께 7.4cm',relic:'40093',alt:'정내1031 귀면와. 옆으로 펼쳐진 입과 얼굴 양옆의 둥근 장식이 보인다.',observation:'옆으로 펼쳐진 입과 얼굴 양옆의 둥근 장식을 살펴보세요.'}
];

const details={eye:{title:'01. 둥글게 솟은 눈',copy:'두 눈의 중심이 둥글게 솟아 있습니다. 눈 주변을 감싼 선과 얼굴 표면의 높낮이를 함께 살펴보세요.',x:.45,y:.47},mouth:{title:'02. 입 주변의 선',copy:'코 아래에서 입 주변으로 이어지는 돌출된 선이 보입니다. 양쪽의 모양이 어떻게 마주하고 있는지 관찰해 보세요.',x:.51,y:.59},rim:{title:'03. 반복되는 테두리',copy:'얼굴의 윗 테두리를 따라 둥근 돌기가 반복됩니다. 얼굴 안쪽의 선과 바깥쪽 장식은 어떻게 다르게 보이나요?',x:.52,y:.25}};
// Every instance references this one registry: same artifact, same imagined character.
Object.assign(objects[0],{guardian:'guardian-A01.webp',crop:{x:.311,y:.218,w:.378,h:.580},face:{left:19.5,top:2,width:61},characterName:'둥근 흙의 수호자',characterAlt:'밝은 흙빛의 둥근 몸통과 구슬 돌기 관절, 짧고 튼튼한 다리를 가진 정면 입상의 수호자.',designNote:'둥근 눈과 테두리의 돌기를 넓은 몸통·둥근 관절·구슬 같은 발목 돌기로 확장했습니다. 밝은 흙빛과 정면으로 선 자세에 둥근 양감을 이어 담았습니다.'});
Object.assign(objects[1],{guardian:'guardian-A02.webp',crop:{x:.155,y:.125,w:.696,h:.760},face:{left:24,top:.5,width:41},characterName:'휘감는 선의 수호자',characterAlt:'짙은 흙빛의 휘감는 몸과 흐르는 갈기, 뻗은 손과 굽힌 무릎을 가진 수호자.',designNote:'흐르는 눈썹과 깊은 굴곡을 갈기·가슴·팔·다리까지 이어지는 곡선으로 확장했습니다. 휘어진 몸과 뻗은 손, 구부린 무릎으로 다른 두 수호자와 구별되는 동세를 만들었습니다.'});
Object.assign(objects[2],{guardian:'guardian-A03.webp',crop:{x:.222,y:.140,w:.573,h:.650},face:{left:17.5,top:5.5,width:65},characterName:'넓은 웃음의 수호자',characterAlt:'회색의 넓은 몸과 소용돌이 관절, 큰 손발을 펼치고 낮게 앉은 수호자.',designNote:'넓게 펼쳐진 입과 둥근 볼 장식을 낮고 넓게 앉은 체구·소용돌이 관절·큰 손발로 확장했습니다. 사진의 회색 표면과 가로로 펼쳐진 형태를 몸 전체의 인상에 이어 담았습니다.'});
const officialURL=o=>`https://www.museum.go.kr/MUSEUM/contents/M0502000000.do?relicId=${o.relic}&schM=view&searchId=search`;
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const sections=$$('.scene'),ids=sections.map(s=>s.id);
const sideState={left:{index:0,scale:1,overlay:true},right:{index:2,scale:1,overlay:true}};
const dialogOpeners=new WeakMap();
let current=0,selectedDetail=null,viewerScale=1,viewerObject=objects[0],viewerOriginal=false;
let guardianIndex=1,guardianScale=1;
const initialDetailCopy='얼굴 위 기와를 눌러 자세히 보세요. 아래 관찰 버튼을 선택하면 사진을 가리지 않고 눈·입·테두리를 살펴볼 수 있습니다.';

function imageFailure(img){
 if(img.dataset.failed)return;img.dataset.failed='true';img.hidden=true;
 const message=document.createElement('p');message.className='image-error';message.setAttribute('role','status');
 message.textContent=img.classList.contains('imagined-character')?'상상 이미지를 불러오지 못했습니다. 실제 기와 사진과 해설은 계속 확인할 수 있습니다.':'기와 사진을 불러오지 못했습니다. 소장품 원문 링크에서 자료를 확인해 주세요.';
 const tile=img.closest('.tile-overlay');
 if(tile){tile.disabled=true;tile.after(message);}else img.after(message);
}
function protectImage(img){img.addEventListener('error',()=>imageFailure(img),{once:true});if(img.complete&&img.naturalWidth===0)imageFailure(img);}
function fitLayer(container,scale=1){
 const scene=container.querySelector('.layered-scene');if(!scene)return;
 const width=container.clientWidth||400,height=container.clientHeight||600;
 scene.style.width=`${Math.min(width,height*2/3)*scale}px`;
}
function renderLayer(container,index,scale=1,overlay=true){
 const o=objects[index];container.replaceChildren();container.dataset.objectId=o.id;
 const scene=document.createElement('div');scene.className='layered-scene';scene.dataset.objectId=o.id;
 const base=document.createElement('img');base.className='imagined-character';base.src=`./assets/${o.guardian}?v=5`;base.width=1024;base.height=1536;base.alt=`${o.number}에서 상상한 ${o.characterName}. ${o.characterAlt} AI 창작이며 학술 복원도가 아닙니다.`;base.decoding='async';
 const tile=document.createElement('button');tile.className='tile-overlay';tile.setAttribute('aria-label',`${o.number} 얼굴 위 실제 기와 상세 확대`);tile.title='실제 기와를 눌러 상세 사진 보기';tile.hidden=!overlay;
 tile.style.left=`${o.face.left}%`;tile.style.top=`${o.face.top}%`;tile.style.width=`${o.face.width}%`;
 const crop=document.createElement('span');crop.className='tile-crop';crop.style.aspectRatio=String(o.width*o.crop.w/(o.height*o.crop.h));
 const photo=document.createElement('img');photo.src=`./assets/${o.id}.jpg`;photo.alt=o.alt;photo.className=`overlaid-artifact artifact-${o.id}`;photo.width=o.width;photo.height=o.height;
 photo.style.clipPath=`url(#${o.id})`;photo.style.width=`${100/o.crop.w}%`;photo.style.left=`${-100*o.crop.x/o.crop.w}%`;photo.style.top=`${-100*o.crop.y/o.crop.h}%`;
 crop.append(photo);tile.append(crop);scene.append(base,tile);container.append(scene);
 tile.addEventListener('click',()=>showArtifact(index));protectImage(base);protectImage(photo);fitLayer(container,scale);
}
function setLayerVisibility(container,button,show){
 const tile=container.querySelector('.tile-overlay');if(tile)tile.hidden=!show;
 button.setAttribute('aria-pressed',String(show));button.textContent=show?'기와 겹침 숨기기':'실제 기와 겹쳐 보기';
}
$$('[data-layered]').forEach(container=>{const index=Number(container.dataset.layered),o=objects[index];renderLayer(container,index);const caption=container.closest('.character-figure')?.querySelector('figcaption');if(caption){const note=document.createElement('p');note.className='character-design-note';const title=document.createElement('strong');title.textContent=o.characterName;note.append(title,document.createElement('br'),document.createTextNode(o.designNote));caption.prepend(note);}});
$$('[data-layer-toggle]').forEach(button=>button.addEventListener('click',()=>{
 const container=button.closest('.character-figure').querySelector('[data-layered]');setLayerVisibility(container,button,button.getAttribute('aria-pressed')!=='true');
}));
function scaleSide(side,delta){
 const state=sideState[side];state.scale=Math.max(1,Math.min(3,state.scale+delta));fitLayer($(`#${side}-image`),state.scale);
 $(`#${side}-scale`).textContent=`${Math.round(state.scale*100)}%`;
 $$(`[data-scale^="${side}:"]`).forEach(button=>button.disabled=Number(button.dataset.scale.split(':')[1])<0?state.scale===1:state.scale===3);
}
function renderSide(side){
 const state=sideState[side],o=objects[state.index];renderLayer($(`#${side}-image`),state.index,state.scale,state.overlay);
 $(`#${side}-select`).value=String(state.index);
 $(`#${side}-info`).innerHTML=`<span class="label">${o.era} · ${o.number}</span><h3>도깨비얼굴무늬 기와</h3><p>${o.material}<br>${o.size}</p><p><span class="label">실제 사진에서 관찰하기</span><br>${o.observation}</p><p class="character-design-note"><span class="label">기와에서 이어진 형태 · ${o.characterName}</span><br>${o.designNote}</p><p class="small">캐릭터와 얼굴 위 배치는 AI 창작 상상입니다.</p><a href="${officialURL(o)}" target="_blank" rel="noopener">사진 © 국립중앙박물관 · 공공누리 제1유형 · 원문 ↗</a>`;
 setLayerVisibility($(`#${side}-image`),$(`[data-side-toggle="${side}"]`),state.overlay);scaleSide(side,0);
 $('#comparison-note').textContent=sideState.left.index===sideState.right.index?'같은 기와를 선택하면 같은 캐릭터와 같은 겹침 위치가 표시됩니다.':'각 수호자의 얼굴 위 실제 기와를 눌러 눈·입·윤곽을 자세히 비교해 보세요.';
}
Object.keys(sideState).forEach(side=>{
 const select=$(`#${side}-select`);objects.forEach((o,index)=>{const option=document.createElement('option');option.value=String(index);option.textContent=`${o.number} · ${o.era}`;select.append(option);});
 select.addEventListener('change',()=>{sideState[side]={index:Number(select.value),scale:1,overlay:true};renderSide(side);});renderSide(side);
});
$$('[data-scale]').forEach(button=>button.addEventListener('click',()=>{const [side,delta]=button.dataset.scale.split(':');scaleSide(side,Number(delta));}));
$$('[data-side-toggle]').forEach(button=>button.addEventListener('click',()=>{const side=button.dataset.sideToggle;sideState[side].overlay=!sideState[side].overlay;setLayerVisibility($(`#${side}-image`),button,sideState[side].overlay);}));
function resetComparison(){sideState.left={index:0,scale:1,overlay:true};sideState.right={index:2,scale:1,overlay:true};renderSide('left');renderSide('right');}
$('#reset-compare').addEventListener('click',resetComparison);
function refreshCompositions(){
 $$('[data-layered]').forEach(container=>fitLayer(container));Object.keys(sideState).forEach(side=>scaleSide(side,0));
 if($('#guardian-dialog').open)sizeGuardian(0);if($('#viewer').open)scaleViewer(0);
}
function navigate(index,focus=true){
 current=Math.max(0,Math.min(4,index));sections.forEach((section,i)=>section.hidden=i!==current);
 $$('[data-step]').forEach(a=>{if(Number(a.dataset.step)===current)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');});
 $('#previous').disabled=current===0;$('#next').disabled=current===4;$('#progress').value=current+1;$('#progress-text').textContent=`${String(current+1).padStart(2,'0')} / 05`;
 if(focus){window.scrollTo(0,0);sections[current].querySelector('h1,h2').focus({preventScroll:true});}requestAnimationFrame(refreshCompositions);
}
function go(index){if(location.hash==='#'+ids[index])navigate(index);else location.hash='#'+ids[index];}
window.addEventListener('hashchange',()=>navigate(Math.max(0,ids.indexOf(location.hash.slice(1)))));
$$('[data-go]').forEach(button=>button.addEventListener('click',()=>go(Number(button.dataset.go))));
$('#previous').addEventListener('click',()=>go(Math.max(0,current-1)));$('#next').addEventListener('click',()=>go(Math.min(4,current+1)));
$$('[data-source-link]').forEach(a=>a.href=officialURL(objects[Number(a.dataset.sourceLink)]));
$$('[data-detail]').forEach(button=>button.addEventListener('click',()=>{
 selectedDetail=button.dataset.detail;const detail=details[selectedDetail];$('#detail-title').textContent=detail.title;$('#detail-copy').textContent=detail.copy;
 $$('[data-detail]').forEach(other=>other.setAttribute('aria-pressed',String(other.dataset.detail===selectedDetail)));$('#detail-zoom').textContent='선택한 부위 확대 ↗';
 const panel=$('.observation-text');panel.classList.remove('detail-updated');requestAnimationFrame(()=>panel.classList.add('detail-updated'));
}));

function openDialog(dialog){dialogOpeners.set(dialog,document.activeElement);dialog.showModal();dialog.querySelector('[data-close]').focus();}
$$('dialog').forEach(dialog=>{
 dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
 dialog.addEventListener('close',()=>{const opener=dialogOpeners.get(dialog);if(opener?.isConnected&&!opener.closest('[hidden]'))opener.focus({preventScroll:true});else sections[current].querySelector('h1,h2').focus({preventScroll:true});});
});
function fitImage(viewport,img,ratio,scale){const width=viewport.clientWidth||640,height=viewport.clientHeight||480;img.style.width=`${Math.min(width,height*ratio)*scale}px`;img.style.height='auto';}
function scaleViewer(delta){viewerScale=Math.max(1,Math.min(4,viewerScale+delta));fitImage($('.viewer-viewport'),$('#viewer-image'),viewerObject.width/viewerObject.height,viewerScale);$('#zoom-level').textContent=`${Math.round(viewerScale*100)}%`;$('#zoom-out').disabled=viewerScale===1;$('#zoom-in').disabled=viewerScale===4;}
function openViewer(index,detail=null){
 viewerObject=objects[index];viewerOriginal=false;$('#original-toggle').setAttribute('aria-pressed','false');$('#original-toggle').textContent='원본 사진 보기';$('#viewer-treatment').textContent='실제 기와 사진의 촬영 배경을 가린 화면입니다.';$('.viewer-viewport').classList.remove('show-original');
 const o=viewerObject,img=document.createElement('img');img.id='viewer-image';img.src=`./assets/${o.id}.jpg`;img.alt=o.alt;img.width=o.width;img.height=o.height;img.className=`artifact-photo artifact-${o.id}`;img.style.clipPath=`url(#${o.id})`;$('.viewer-viewport').replaceChildren(img);protectImage(img);
 $('#viewer-title').textContent=`도깨비얼굴무늬 기와 · ${o.number}`;$('#viewer-observation').textContent=detail?detail.copy:o.observation;
 $('#viewer-caption').replaceChildren(document.createTextNode(`${o.era} · ${o.size} · 사진 © 국립중앙박물관 · 공공누리 제1유형 · `));
 const source=document.createElement('a');source.href=officialURL(o);source.target='_blank';source.rel='noopener';source.textContent='소장품 원문 ↗';$('#viewer-caption').append(source);
 viewerScale=detail?2:1;openDialog($('#viewer'));scaleViewer(0);const viewport=$('.viewer-viewport');viewport.scrollTop=0;viewport.scrollLeft=0;
 if(detail)requestAnimationFrame(()=>{const r=img.getBoundingClientRect();viewport.scrollLeft=img.offsetLeft+r.width*detail.x-viewport.clientWidth/2;viewport.scrollTop=img.offsetTop+r.height*detail.y-viewport.clientHeight/2;});
}
function showArtifact(index,detail=null){if($('#guardian-dialog').open){$('#guardian-dialog').addEventListener('close',()=>openViewer(index,detail),{once:true});$('#guardian-dialog').close();}else openViewer(index,detail);}
$$('[data-view]').forEach(button=>button.addEventListener('click',()=>showArtifact(Number(button.dataset.view),button.id==='detail-zoom'&&selectedDetail?details[selectedDetail]:null)));
$$('[data-side-view]').forEach(button=>button.addEventListener('click',()=>showArtifact(sideState[button.dataset.sideView].index)));
$('#zoom-in').addEventListener('click',()=>scaleViewer(.25));$('#zoom-out').addEventListener('click',()=>scaleViewer(-.25));$('#zoom-reset').addEventListener('click',()=>{viewerScale=1;scaleViewer(0);$('.viewer-viewport').scrollTop=0;$('.viewer-viewport').scrollLeft=0;});
$('#original-toggle').addEventListener('click',()=>{viewerOriginal=!viewerOriginal;$('.viewer-viewport').classList.toggle('show-original',viewerOriginal);$('#original-toggle').setAttribute('aria-pressed',String(viewerOriginal));$('#original-toggle').textContent=viewerOriginal?'배경 가린 기와 보기':'원본 사진 보기';$('#viewer-treatment').textContent=viewerOriginal?'촬영 배경이 포함된 국립중앙박물관 원본 사진입니다.':'실제 기와 사진의 촬영 배경을 가린 화면입니다.';});
function sizeGuardian(delta){guardianScale=Math.max(1,Math.min(3,guardianScale+delta));fitLayer($('.guardian-viewport'),guardianScale);$('#guardian-scale').textContent=`${Math.round(guardianScale*100)}%`;$('#guardian-minus').disabled=guardianScale===1;$('#guardian-plus').disabled=guardianScale===3;}
function openGuardian(index){guardianIndex=index;guardianScale=1;const o=objects[index];$('#guardian-title').textContent=`${o.number} · ${o.characterName}`;$('.guardian-disclaimer').textContent=`${o.designNote} 캐릭터와 얼굴 배치는 AI 창작 상상이며 역사적 복원이 아닙니다.`;openDialog($('#guardian-dialog'));renderLayer($('.guardian-viewport'),index);setLayerVisibility($('.guardian-viewport'),$('#guardian-layer-toggle'),true);sizeGuardian(0);$('.guardian-viewport').scrollTop=0;$('.guardian-viewport').scrollLeft=0;}
$$('[data-guardian]').forEach(button=>button.addEventListener('click',()=>openGuardian(Number(button.dataset.guardian))));
$$('[data-side-guardian]').forEach(button=>button.addEventListener('click',()=>openGuardian(sideState[button.dataset.sideGuardian].index)));
$('#guardian-plus').addEventListener('click',()=>sizeGuardian(.25));$('#guardian-minus').addEventListener('click',()=>sizeGuardian(-.25));$('#guardian-reset').addEventListener('click',()=>{guardianScale=1;sizeGuardian(0);$('.guardian-viewport').scrollTop=0;$('.guardian-viewport').scrollLeft=0;});
$('#guardian-layer-toggle').addEventListener('click',()=>setLayerVisibility($('.guardian-viewport'),$('#guardian-layer-toggle'),$('#guardian-layer-toggle').getAttribute('aria-pressed')!=='true'));
$('#guardian-source').addEventListener('click',()=>showArtifact(guardianIndex));
$('#source-list').innerHTML=objects.map(o=>`<article><h3>${o.number} · 도깨비얼굴무늬 기와</h3><p>${o.era} · ${o.material}<br>${o.size}</p><a href="${officialURL(o)}" target="_blank" rel="noopener">국립중앙박물관 소장품 원문 ↗</a></article>`).join('');
$$('[data-sources]').forEach(button=>button.addEventListener('click',()=>openDialog($('#sources-dialog'))));
$('#text-size').addEventListener('click',()=>{const large=document.documentElement.classList.toggle('large-text');$('#text-size').setAttribute('aria-pressed',String(large));$('#text-size').textContent=large?'기본 글씨':'큰 글씨';requestAnimationFrame(refreshCompositions);});
$('#motion-toggle').addEventListener('click',()=>{const disabled=document.body.classList.toggle('no-motion');$('#motion-toggle').setAttribute('aria-pressed',String(disabled));$('#motion-toggle').textContent=disabled?'화면 효과 켜기':'화면 효과 끄기';});
$('#reflection').addEventListener('input',()=>$('#reflection-status').textContent=`${$('#reflection').value.length} / 240자 · 새로고침하면 사라집니다.`);
$('#restart').addEventListener('click',()=>{selectedDetail=null;$('#detail-title').textContent='얼굴에 남은 세 가지 단서';$('#detail-copy').textContent=initialDetailCopy;$$('[data-detail]').forEach(button=>button.setAttribute('aria-pressed','false'));$('#detail-zoom').textContent='사진 확대 ↗';resetComparison();$$('[data-layer-toggle]').forEach(button=>{const container=button.closest('.character-figure').querySelector('[data-layered]');setLayerVisibility(container,button,true);});$$('input[name=impression]').forEach(input=>input.checked=false);$('#reflection').value='';$('#reflection-status').textContent='기록은 서버에 전송되거나 영구 저장되지 않습니다.';go(0);});
window.addEventListener('resize',refreshCompositions);

// Try audible autoplay, handle policy rejection, and honor explicit Stop forever until Play.
const music=$('#exhibition-music'),musicStatus=$('#music-status');
let musicPending=false,musicOperation=0,musicOptedOut=false,needsFirstGesture=true;
music.volume=1;
function updateAudioUI(){
 const active=!music.paused;$$('[data-music-play]').forEach(button=>{button.setAttribute('aria-pressed',String(active));button.setAttribute('aria-busy',String(musicPending));button.title=musicPending?'음악을 불러오는 중입니다. 정지로 취소할 수 있습니다.':active?'배경음악 재생 중':'배경음악 재생';});
}
async function playMusic(){
 if(musicPending||!music.paused)return;
 if(document.hidden){needsFirstGesture=true;return;}
 musicOptedOut=false;const operation=++musicOperation;musicPending=true;updateAudioUI();
 try{await music.play();if(operation!==musicOperation)return;if(document.hidden){music.pause();return;}needsFirstGesture=false;musicStatus.textContent='배경음악 재생 중입니다.';}
 catch(error){if(operation===musicOperation){needsFirstGesture=error.name==='NotAllowedError';musicStatus.textContent='자동재생이 제한되었거나 음악을 불러오지 못했습니다. 캐릭터 옆 재생 버튼을 눌러 주세요.';}}
 finally{if(operation===musicOperation){musicPending=false;updateAudioUI();}}
}
function stopMusic(){++musicOperation;musicPending=false;musicOptedOut=true;needsFirstGesture=false;music.autoplay=false;music.pause();try{music.currentTime=0;}catch(error){/* A not-yet-loaded media resource may not be seekable. */}musicStatus.textContent='배경음악을 정지하고 처음으로 되돌렸습니다.';updateAudioUI();}
$$('[data-music-play]').forEach(button=>button.addEventListener('click',playMusic));$$('[data-music-stop]').forEach(button=>button.addEventListener('click',stopMusic));
function firstGesture(event){if('button' in event&&event.button>0)return;if(event.target.closest?.('[data-music-play],[data-music-stop]'))return;if(event.type==='keydown'&&!['Enter',' '].includes(event.key))return;if(needsFirstGesture&&!musicOptedOut&&!musicPending)playMusic();}
document.addEventListener('pointerdown',firstGesture);document.addEventListener('click',firstGesture);document.addEventListener('keydown',firstGesture);
music.addEventListener('play',()=>{if(musicOptedOut){music.pause();return;}updateAudioUI();});music.addEventListener('pause',updateAudioUI);music.addEventListener('playing',updateAudioUI);
music.addEventListener('error',()=>{++musicOperation;musicPending=false;needsFirstGesture=false;music.pause();musicStatus.textContent='배경음악을 불러오지 못했습니다. 전시는 계속 관람할 수 있습니다.';updateAudioUI();});
function pauseOnLeave(){++musicOperation;musicPending=false;music.pause();needsFirstGesture=!musicOptedOut;updateAudioUI();}
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseOnLeave();});window.addEventListener('pagehide',pauseOnLeave);
navigate(Math.max(0,ids.indexOf(location.hash.slice(1))),false);updateAudioUI();playMusic();
