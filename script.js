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

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const officialURL = object => `https://www.museum.go.kr/MUSEUM/contents/M0502000000.do?relicId=${object.relic}&schM=view&searchId=search`;
const sections = $$('.scene');
const sceneIds = sections.map(section => section.id);
const sceneNames = ['프롤로그','얼굴의 정체','지붕 위의 수호자','서로 다른 얼굴들','얼굴에 남겨진 마음'];
const initialComparison = () => ({mode:'artifact',left:0,right:2,scales:{artifact:{left:1,right:1},guardian:{left:1,right:1}},overlays:{left:true,right:true},mobileSide:'left',lens:'eye'});
const state = {scene:0,detail:null,observed:new Set(),comparison:initialComparison(),viewer:{index:0,scale:1,original:false},guardian:{index:1,scale:1},resultGenerated:false,resultText:''};
const renderedScenes = new Set();
const initialRoofText={title:$('#roof-detail-title').textContent,copy:$('#roof-detail-copy').textContent};
const dialogOpeners = new WeakMap();
const mobileQuery = typeof window.matchMedia==='function' ? window.matchMedia('(max-width: 767px)') : null;
const isMobile = () => mobileQuery ? mobileQuery.matches : window.innerWidth < 768;
const clamp = (value,min,max) => Math.max(min,Math.min(max,value));
const ratioFor = object => object.width*object.crop.w/(object.height*object.crop.h);

function protectImage(image,kind='artifact') {
 let failed=false;
 function fail() {
  if(failed)return;failed=true;image.hidden=true;
  const message=document.createElement('span');message.className='image-error';message.setAttribute('role','status');
  message.textContent=kind==='guardian'?'상상 이미지를 불러오지 못했습니다. 실제 기와와 해설은 계속 확인할 수 있습니다.':'사진을 불러오지 못했습니다. 아래 공식 소장품 원문에서 자료를 확인해 주세요.';
  const button=image.closest('.tile-overlay');if(button){button.disabled=true;button.after(message);}else image.after(message);
 }
 image.addEventListener('error',fail,{once:true});
 if(image.complete&&image.naturalWidth===0)fail();
}
function sourceImage(object,{priority=false,id=null}={}) {
 const image=document.createElement('img');
 image.width=object.width;image.height=object.height;image.alt=object.alt;image.decoding='async';image.loading=priority?'eager':'lazy';
 if(priority)image.setAttribute('fetchpriority','high');if(id)image.id=id;
 image.src=`./assets/${object.id}.jpg`;return image;
}
function makeCrop(object,options={}) {
 const crop=document.createElement('span');crop.className='artifact-crop';crop.style.aspectRatio=String(ratioFor(object));
 const image=sourceImage(object,options);image.className='cropped-source';
 image.style.clipPath=`url(#${object.id})`;image.style.width=`${100/object.crop.w}%`;image.style.left=`${-100*object.crop.x/object.crop.w}%`;image.style.top=`${-100*object.crop.y/object.crop.h}%`;
 crop.append(image);return crop;
}
function fitNode(container,node,ratio,scale=1) {
 const width=container.clientWidth||400,height=container.clientHeight||360;
 node.style.width=`${Math.max(1,Math.min(width,height*ratio))*scale}px`;
}
function fitArtifact(container,scale=1) {
 const node=container.querySelector('.artifact-display');if(!node)return;
 fitNode(container,node,ratioFor(objects[Number(container.dataset.objectIndex)]),scale);
}
function renderArtifact(container,index,{scale=1,clickable=true,priority=false,viewer=false}={}) {
 const object=objects[index];container.replaceChildren();container.dataset.objectIndex=String(index);container.dataset.mediaKind='artifact';
 const frame=document.createElement('div');frame.className='artifact-display';
 const crop=makeCrop(object,{priority,id:viewer?'viewer-image':null});
 if(clickable){const button=document.createElement('button');button.className='photo-open';button.setAttribute('aria-label',`${object.number} 실제 기와 상세 사진 확대`);button.append(crop);button.addEventListener('click',()=>showArtifact(index,container.id==='observation-stage'&&state.detail?details[state.detail]:null));frame.append(button);}else frame.append(crop);
 container.append(frame);protectImage(crop.querySelector('img'));fitArtifact(container,scale);
}
function fitLayer(container,scale=1) {
 const scene=container.querySelector('.layered-scene');if(scene)fitNode(container,scene,2/3,scale);
}
function renderLayer(container,index,{scale=1,overlay=true}={}) {
 const object=objects[index];container.replaceChildren();container.dataset.objectIndex=String(index);container.dataset.mediaKind='guardian';
 const scene=document.createElement('div');scene.className='layered-scene';scene.dataset.objectId=object.id;
 const base=document.createElement('img');base.className='imagined-character';base.width=1024;base.height=1536;base.decoding='async';base.loading='lazy';base.alt=`${object.number}에서 상상한 ${object.characterName}. ${object.characterAlt} AI 창작이며 학술 복원도가 아닙니다.`;base.src=`./assets/${object.guardian}?v=5`;
 const tile=document.createElement('button');tile.className='tile-overlay';tile.title='실제 기와를 눌러 상세 사진 보기';tile.setAttribute('aria-label',`${object.number} 얼굴 위 실제 기와 상세 확대`);tile.hidden=!overlay;
 tile.style.left=`${object.face.left}%`;tile.style.top=`${object.face.top}%`;tile.style.width=`${object.face.width}%`;tile.append(makeCrop(object));tile.addEventListener('click',()=>showArtifact(index));
 scene.append(base,tile);container.append(scene);protectImage(base,'guardian');protectImage(tile.querySelector('img'));fitLayer(container,scale);
}
function setLayerVisibility(container,button,show) {
 const tile=container.querySelector('.tile-overlay');if(tile)tile.hidden=!show;
 button.setAttribute('aria-pressed',String(show));button.textContent=show?'기와 겹침 숨기기':'실제 기와 겹쳐 보기';
}
function ensureImagination(panel) {
 panel.querySelectorAll('[data-layered]').forEach(container=>{if(!container.firstElementChild)renderLayer(container,Number(container.dataset.layered));fitLayer(container);});
}
function toggleImagination(button,panel) {
 const open=panel.hidden;panel.hidden=!open;button.setAttribute('aria-expanded',String(open));
 button.textContent=open?'상상 해석 접기':button.id==='intro-reveal'?'상상 속 수호자 보기 ✦':'관찰에서 이어진 수호자 해석 보기';
 if(open)ensureImagination(panel);
}
$('#intro-reveal').addEventListener('click',()=>toggleImagination($('#intro-reveal'),$('#intro-imagination')));
$('#observe-reveal').addEventListener('click',()=>toggleImagination($('#observe-reveal'),$('#observe-imagination')));
$$('[data-layer-toggle]').forEach(button=>button.addEventListener('click',()=>setLayerVisibility(button.closest('.character-figure').querySelector('[data-layered]'),button,button.getAttribute('aria-pressed')!=='true')));
$$('[data-design-note]').forEach(node=>node.textContent=objects[Number(node.dataset.designNote)].designNote);
$$('[data-source-link]').forEach(link=>link.href=officialURL(objects[Number(link.dataset.sourceLink)]));

function updateObservationTransform() {
 const frame=$('#observation-stage .artifact-display');if(!frame)return;
 if(!state.detail){frame.style.transform='none';return;}
 const point=details[state.detail],crop=objects[0].crop,zoom=1.8;
 const x=(point.x-crop.x)/crop.w,y=(point.y-crop.y)/crop.h;
 frame.style.transformOrigin='0 0';frame.style.transform=`translate(${50-x*zoom*100}%,${50-y*zoom*100}%) scale(${zoom})`;
}
$$('[data-detail]').forEach(button=>button.addEventListener('click',()=>{
 state.detail=button.dataset.detail;state.observed.add(state.detail);const detail=details[state.detail];
 $$('[data-detail]').forEach(other=>other.setAttribute('aria-pressed',String(other.dataset.detail===state.detail)));
 $('#detail-title').textContent=detail.title;$('#detail-copy').textContent=detail.copy;
 $('#observation-progress').textContent=`살펴본 단서 ${state.observed.size} / 3 · 순서는 자유롭습니다.`;
 $('#observe-reveal').disabled=false;if($('#observe-imagination').hidden)$('#observe-reveal').textContent='관찰에서 이어진 수호자 해석 보기';updateObservationTransform();
}));
$('#observation-reset').addEventListener('click',()=>{state.detail=null;$$('[data-detail]').forEach(button=>button.setAttribute('aria-pressed','false'));$('#detail-title').textContent='다시 전체 얼굴 바라보기';$('#detail-copy').textContent='선택한 단서를 얼굴 전체의 선과 높낮이에 연결해 보세요.';updateObservationTransform();});

const roofText={
 ridge:{title:'A · 용마루 끝의 일반적 사용 맥락',copy:'지붕의 높은 선을 이루는 용마루의 끝은 장식기와가 사용되는 곳으로 설명됩니다. 귀면문 기와는 끝부분을 장식하고 수호의 의미를 드러내는 일반적 사례로 읽을 수 있습니다. 전시한 세 점 각각이 이 위치에 있었다는 뜻은 아닙니다.'},
 descending:{title:'B · 내려오는 마루 끝의 일반적 사용 맥락',copy:'문화포털은 귀면문 기와가 내림마루의 끝을 장식하는 기와로도 쓰였다고 설명합니다. 도식은 그 관계를 단순화한 것입니다. 지붕 형식마다 구조와 명칭은 달라질 수 있으며, 세 소장품의 실제 설치 위치는 확인하지 못했습니다.'}
};
$$('[data-roof]').forEach(button=>button.addEventListener('click',()=>{const key=button.dataset.roof;$$('[data-roof]').forEach(other=>other.setAttribute('aria-pressed',String(other===button)));$('#roof-detail-title').textContent=roofText[key].title;$('#roof-detail-copy').textContent=roofText[key].copy;}));

const lensQuestions={eye:'두 눈은 얼마나 둥글게 솟아 있나요? 눈썹과 눈 주변의 선은 어디로 이어지나요?',mouth:'입의 너비와 입 주변의 선은 어떻게 다르게 보이나요?',outline:'바깥 윤곽과 남아 있는 부분을 따라 보세요. 사진에 보이는 결실과 원래 형태를 구분해서 생각해 보세요.',rim:'얼굴 가장자리에서 반복되는 돌기나 선을 찾을 수 있나요? 같은 장식이 세 점 모두에 보이는지도 살펴보세요.'};
function updateComparisonQuestion() {$('#comparison-question').textContent=lensQuestions[state.comparison.lens];$$('[data-compare-lens]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.compareLens===state.comparison.lens)));}
function updateComparisonInfo(side) {
 const object=objects[state.comparison[side]],guardian=state.comparison.mode==='guardian';
 $(`#${side}-info`).innerHTML=`<span class="label">${object.era} · ${object.number}</span><h3>도깨비얼굴무늬 기와</h3><dl><div><dt>재질</dt><dd>${object.material}</dd></div><div><dt>실제 크기</dt><dd>${object.size}</dd></div></dl><p><span class="label">실제 사진의 관찰 단서</span><br>${object.observation}</p>${guardian?`<p class="character-design-note"><span class="label">창작의 연결 · ${object.characterName}</span><br>${object.designNote}</p><p class="interpretation">AI 창작 상상 · 역사적 복원이 아닙니다.</p>`:''}<a href="${officialURL(object)}" target="_blank" rel="noopener">사진 © 국립중앙박물관 · 공공누리 제1유형 · 원문 ↗</a>`;
}
function scaleSide(side,delta=0) {
 const comparison=state.comparison,scales=comparison.scales[comparison.mode];scales[side]=clamp(scales[side]+delta,1,3);
 const viewport=$(`#${side}-image`);if(comparison.mode==='artifact')fitArtifact(viewport,scales[side]);else fitLayer(viewport,scales[side]);
 viewport.classList.toggle('is-zoomed',scales[side]>1);$(`#${side}-scale`).textContent=`${Math.round(scales[side]*100)}%`;
 $$(`[data-scale^="${side}:"]`).forEach(button=>button.disabled=Number(button.dataset.scale.split(':')[1])<0?scales[side]===1:scales[side]===3);
}
function applyMobileComparison() {
 ['left','right'].forEach(side=>{
  $(`[data-side="${side}"]`).hidden=isMobile()&&state.comparison.mobileSide!==side;
  const button=$(`[data-mobile-side="${side}"]`);button.setAttribute('aria-pressed',String(side===state.comparison.mobileSide));button.textContent=`${side==='left'?'왼쪽':'오른쪽'} · ${objects[state.comparison[side]].number}`;
 });
 ['left','right'].forEach(side=>scaleSide(side));
}
function renderComparison() {
 const comparison=state.comparison,guardian=comparison.mode==='guardian';
 $$('[data-mode]').forEach(button=>{const selected=button.dataset.mode===comparison.mode;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;});
 $('#comparison-panel').setAttribute('aria-labelledby',`tab-${comparison.mode}`);
 $('#comparison-mode-description').textContent=guardian?'상상 속 수호자입니다. 같은 기와에는 같은 캐릭터를 사용하며 얼굴 위 실제 기와를 겹쳐 볼 수 있습니다.':'같은 관찰 영역에 맞춘 실제 사진입니다. 실제 크기의 비례 비교가 아닙니다.';
 ['left','right'].forEach(side=>{
  const viewport=$(`#${side}-image`),index=comparison[side],scale=comparison.scales[comparison.mode][side];
  if(guardian)renderLayer(viewport,index,{scale,overlay:comparison.overlays[side]});else renderArtifact(viewport,index,{scale});
  viewport.scrollTop=0;viewport.scrollLeft=0;$(`#${side}-select`).value=String(index);$(`[data-character-controls="${side}"]`).hidden=!guardian;
  setLayerVisibility(viewport,$(`[data-side-toggle="${side}"]`),comparison.overlays[side]);updateComparisonInfo(side);
 });
 $('#comparison-note').textContent=comparison.left===comparison.right?'같은 유물을 선택했습니다. 실제 사진과 상상 속 캐릭터도 같은 자료로 표시됩니다.':'관찰 질문에 정해진 답은 없습니다. 서로 다른 선과 높낮이를 직접 찾아보세요.';
 updateComparisonQuestion();applyMobileComparison();
}
function switchComparisonMode(mode) {if(!['artifact','guardian'].includes(mode))return;state.comparison.mode=mode;renderComparison();}
$$('[data-mode]').forEach(button=>{
 button.addEventListener('click',()=>switchComparisonMode(button.dataset.mode));
 button.addEventListener('keydown',event=>{const keys=['ArrowLeft','ArrowRight','Home','End'];if(!keys.includes(event.key))return;event.preventDefault();const mode=event.key==='Home'?'artifact':event.key==='End'?'guardian':state.comparison.mode==='artifact'?'guardian':'artifact';switchComparisonMode(mode);$(`#tab-${mode}`).focus();});
});
['left','right'].forEach(side=>{
 objects.forEach((object,index)=>{const option=document.createElement('option');option.value=String(index);option.textContent=`${object.number} · ${object.era}`;$(`#${side}-select`).append(option);});
 $(`#${side}-select`).addEventListener('change',()=>{state.comparison[side]=Number($(`#${side}-select`).value);state.comparison.scales.artifact[side]=1;state.comparison.scales.guardian[side]=1;state.comparison.overlays[side]=true;renderComparison();});
});
$$('[data-scale]').forEach(button=>button.addEventListener('click',()=>{const [side,delta]=button.dataset.scale.split(':');scaleSide(side,Number(delta));}));
$$('[data-mobile-side]').forEach(button=>button.addEventListener('click',()=>{state.comparison.mobileSide=button.dataset.mobileSide;applyMobileComparison();}));
$$('[data-side-toggle]').forEach(button=>button.addEventListener('click',()=>{const side=button.dataset.sideToggle;state.comparison.overlays[side]=!state.comparison.overlays[side];setLayerVisibility($(`#${side}-image`),button,state.comparison.overlays[side]);}));
$$('[data-compare-lens]').forEach(button=>button.addEventListener('click',()=>{state.comparison.lens=button.dataset.compareLens;updateComparisonQuestion();}));
$('#reset-compare').addEventListener('click',()=>{state.comparison=initialComparison();renderComparison();});

function initScene(index) {
 if(renderedScenes.has(index))return;renderedScenes.add(index);
 if(index===0)renderArtifact($('#intro-artifact'),1,{priority:true});
 if(index===1)renderArtifact($('#observation-stage'),0);
 if(index===3)renderComparison();
 if(index===4)renderArtifact($('#outro-artifact'),1);
}
function refreshVisibleMedia() {
 $$('[data-layered]').forEach(container=>{if(!container.closest('[hidden]'))fitLayer(container);});
 ['#intro-artifact','#outro-artifact','#observation-stage'].forEach(selector=>{if(!$(selector).closest('[hidden]'))fitArtifact($(selector));});
 if(state.scene===1)updateObservationTransform();if(state.scene===3)applyMobileComparison();
 if($('#viewer').open)scaleViewer(0);if($('#guardian-dialog').open)sizeGuardian(0);
}
function navigate(index,focus=true) {
 state.scene=clamp(index,0,4);$$('dialog[open]').forEach(dialog=>dialog.close());
 sections.forEach((section,i)=>section.hidden=i!==state.scene);initScene(state.scene);
 $$('[data-step]').forEach(link=>{if(Number(link.dataset.step)===state.scene)link.setAttribute('aria-current','step');else link.removeAttribute('aria-current');});
 $('#previous').disabled=state.scene===0;$('#next').disabled=state.scene===4;$('#progress').value=state.scene+1;
 $('#progress-text').textContent=`${String(state.scene+1).padStart(2,'0')} / 05`;$('#scene-location').textContent=`${String(state.scene+1).padStart(2,'0')} / 05 · ${sceneNames[state.scene]}`;
 if(state.scene===4)updateBeforeImpression();
 if(focus){window.scrollTo(0,0);sections[state.scene].querySelector('h1,h2').focus({preventScroll:true});}
 requestAnimationFrame(()=>{refreshVisibleMedia();if(isMobile()){const link=$(`[data-step="${state.scene}"]`),scroller=$('.chapter-links');scroller.scrollLeft=link.offsetLeft-scroller.clientWidth/2+link.clientWidth/2;}});
}
function go(index) {if(location.hash==='#'+sceneIds[index])navigate(index);else location.hash='#'+sceneIds[index];}
window.addEventListener('hashchange',()=>navigate(Math.max(0,sceneIds.indexOf(location.hash.slice(1)))));
$$('[data-go]').forEach(button=>button.addEventListener('click',()=>go(Number(button.dataset.go))));
$('#previous').addEventListener('click',()=>go(Math.max(0,state.scene-1)));$('#next').addEventListener('click',()=>go(Math.min(4,state.scene+1)));
window.addEventListener('resize',refreshVisibleMedia);mobileQuery?.addEventListener?.('change',()=>{if(state.scene===3)applyMobileComparison();});
$('#text-size').addEventListener('click',()=>{const large=document.documentElement.classList.toggle('large-text');$('#text-size').setAttribute('aria-pressed',String(large));$('#text-size').textContent=large?'기본 글씨':'큰 글씨';requestAnimationFrame(refreshVisibleMedia);});
$('#motion-toggle').addEventListener('click',()=>{const disabled=document.body.classList.toggle('no-motion');$('#motion-toggle').setAttribute('aria-pressed',String(disabled));$('#motion-toggle').textContent=disabled?'화면 효과 켜기':'화면 효과 끄기';});

function openDialog(dialog) {dialogOpeners.set(dialog,document.activeElement);dialog.showModal();dialog.querySelector('[data-close]').focus();}
$$('dialog').forEach(dialog=>{
 dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
 dialog.addEventListener('close',()=>{const opener=dialogOpeners.get(dialog);if(opener?.isConnected&&!opener.closest('[hidden]'))opener.focus({preventScroll:true});else sections[state.scene].querySelector('h1,h2').focus({preventScroll:true});});
});
function updateViewerMedia() {
 const object=objects[state.viewer.index],viewport=$('.viewer-viewport');viewport.replaceChildren();viewport.dataset.objectIndex=String(state.viewer.index);
 if(state.viewer.original){const image=sourceImage(object,{id:'viewer-image'});image.className='original-image';viewport.append(image);protectImage(image);}else renderArtifact(viewport,state.viewer.index,{clickable:false,viewer:true});
 viewport.classList.toggle('show-original',state.viewer.original);$('#original-toggle').setAttribute('aria-pressed',String(state.viewer.original));$('#original-toggle').textContent=state.viewer.original?'촬영 배경 가린 기와 보기':'촬영 배경 포함 원본 보기';
 $('#viewer-treatment').textContent=state.viewer.original?'촬영 배경과 거치대를 포함한 국립중앙박물관 원본 사진입니다.':'원본 사진의 비율을 유지하고 촬영 배경만 화면에서 가린 표시입니다.';scaleViewer(0);
}
function scaleViewer(delta) {
 const viewer=state.viewer;viewer.scale=clamp(viewer.scale+delta,1,4);const viewport=$('.viewer-viewport'),object=objects[viewer.index];
 if(viewer.original){const image=$('#viewer-image');if(image)fitNode(viewport,image,object.width/object.height,viewer.scale);}else fitArtifact(viewport,viewer.scale);
 viewport.classList.toggle('is-zoomed',viewer.scale>1);$('#zoom-level').textContent=`${Math.round(viewer.scale*100)}%`;$('#zoom-out').disabled=viewer.scale===1;$('#zoom-in').disabled=viewer.scale===4;
}
function openViewer(index,detail=null) {
 state.viewer={index,scale:detail?2:1,original:false};const object=objects[index];$('#viewer-title').textContent=`도깨비얼굴무늬 기와 · ${object.number}`;$('#viewer-observation').textContent=detail?detail.copy:object.observation;
 $('#viewer-caption').innerHTML=`<p>${object.era} · ${object.material}<br>${object.size}</p><p>사진 © 국립중앙박물관 · 공공누리 제1유형<br><a href="${officialURL(object)}" target="_blank" rel="noopener">공식 소장품 원문 ↗</a></p>`;
 $('.viewer-details').open=false;openDialog($('#viewer'));updateViewerMedia();const viewport=$('.viewer-viewport');viewport.scrollTop=0;viewport.scrollLeft=0;
 if(detail)requestAnimationFrame(()=>{const frame=viewport.querySelector('.artifact-display');if(!frame)return;const r=frame.getBoundingClientRect(),crop=object.crop;viewport.scrollLeft=frame.offsetLeft+r.width*(detail.x-crop.x)/crop.w-viewport.clientWidth/2;viewport.scrollTop=frame.offsetTop+r.height*(detail.y-crop.y)/crop.h-viewport.clientHeight/2;});
}
function showArtifact(index,detail=null) {if($('#guardian-dialog').open){$('#guardian-dialog').addEventListener('close',()=>openViewer(index,detail),{once:true});$('#guardian-dialog').close();}else openViewer(index,detail);}
$$('[data-view]').forEach(button=>button.addEventListener('click',()=>showArtifact(Number(button.dataset.view),button.id==='detail-zoom'&&state.detail?details[state.detail]:null)));
$$('[data-side-view]').forEach(button=>button.addEventListener('click',()=>showArtifact(state.comparison[button.dataset.sideView])));
$('#zoom-in').addEventListener('click',()=>scaleViewer(.25));$('#zoom-out').addEventListener('click',()=>scaleViewer(-.25));$('#zoom-reset').addEventListener('click',()=>{state.viewer.scale=1;scaleViewer(0);$('.viewer-viewport').scrollTop=0;$('.viewer-viewport').scrollLeft=0;});
$('#original-toggle').addEventListener('click',()=>{state.viewer.original=!state.viewer.original;state.viewer.scale=1;updateViewerMedia();$('.viewer-viewport').scrollTop=0;$('.viewer-viewport').scrollLeft=0;});
function sizeGuardian(delta) {state.guardian.scale=clamp(state.guardian.scale+delta,1,3);fitLayer($('.guardian-viewport'),state.guardian.scale);$('.guardian-viewport').classList.toggle('is-zoomed',state.guardian.scale>1);$('#guardian-scale').textContent=`${Math.round(state.guardian.scale*100)}%`;$('#guardian-minus').disabled=state.guardian.scale===1;$('#guardian-plus').disabled=state.guardian.scale===3;}
function openGuardian(index) {state.guardian={index,scale:1};const object=objects[index];$('#guardian-title').textContent=`${object.number} · ${object.characterName}`;$('.guardian-disclaimer').textContent='AI 창작 상상 · 몸·자세·얼굴 겹침 위치는 학술적 복원도가 아닙니다.';$('#guardian-design-note').textContent=object.designNote;$('#guardian-credit').innerHTML=`실제 기와 사진 © 국립중앙박물관 · ${object.number} · 공공누리 제1유형 · <a href="${officialURL(object)}" target="_blank" rel="noopener">공식 소장품 원문 ↗</a>`;openDialog($('#guardian-dialog'));renderLayer($('.guardian-viewport'),index);setLayerVisibility($('.guardian-viewport'),$('#guardian-layer-toggle'),true);sizeGuardian(0);$('.guardian-viewport').scrollTop=0;$('.guardian-viewport').scrollLeft=0;}
$$('[data-guardian]').forEach(button=>button.addEventListener('click',()=>openGuardian(Number(button.dataset.guardian))));
$$('[data-side-guardian]').forEach(button=>button.addEventListener('click',()=>openGuardian(state.comparison[button.dataset.sideGuardian])));
$('#guardian-plus').addEventListener('click',()=>sizeGuardian(.25));$('#guardian-minus').addEventListener('click',()=>sizeGuardian(-.25));$('#guardian-reset').addEventListener('click',()=>{state.guardian.scale=1;sizeGuardian(0);$('.guardian-viewport').scrollTop=0;$('.guardian-viewport').scrollLeft=0;});
$('#guardian-layer-toggle').addEventListener('click',()=>setLayerVisibility($('.guardian-viewport'),$('#guardian-layer-toggle'),$('#guardian-layer-toggle').getAttribute('aria-pressed')!=='true'));$('#guardian-source').addEventListener('click',()=>showArtifact(state.guardian.index));
$('#source-list').innerHTML=objects.map(object=>`<article><h3>${object.number} · 도깨비얼굴무늬 기와</h3><p>${object.era} · ${object.material}<br>${object.size}</p><a href="${officialURL(object)}" target="_blank" rel="noopener">국립중앙박물관 소장품 원문 ↗</a></article>`).join('');
$$('[data-sources]').forEach(button=>button.addEventListener('click',()=>openDialog($('#sources-dialog'))));

const targets={people:'가족과 친구',peace:'나의 평온',everyday:'우리의 일상',nature:'자연과 생명'};
const symbols={
 circle:{name:'원',meaning:'감싸는 마음',svg:'<circle cx="80" cy="80" r="53"/><circle cx="80" cy="80" r="38"/>'},
 mountain:{name:'산',meaning:'든든한 마음',svg:'<path d="M18 124 63 35 91 85 111 54 145 124Z"/><path d="M48 65 63 79 77 62"/>'},
 wave:{name:'물결',meaning:'유연한 마음',svg:'<path d="M16 48Q48 18 80 48T144 48M16 82Q48 52 80 82T144 82M16 116Q48 86 80 116T144 116"/>'},
 star:{name:'별',meaning:'길을 비추는 마음',svg:'<path d="M80 15 97 59 144 61 108 91 120 139 80 112 40 139 52 91 16 61 63 59Z"/>'}
};
function updateBeforeImpression() {const before=$('input[name="first-impression"]:checked');$('#before-impression').textContent=before?`처음에는 “${before.value}”라고 느꼈습니다. 지금의 시선은 어떻게 달라졌나요?`:'처음 마주했을 때와 지금, 이 얼굴은 어떻게 다르게 보이나요?';}
function renderSymbolCard() {
 const target=targets[$('#protect-target').value],symbol=symbols[$('#protect-symbol').value];if(!target||!symbol)return false;
 const reflection=$('#reflection').value.slice(0,240).trim(),before=$('input[name="first-impression"]:checked')?.value,after=$('input[name="impression"]:checked')?.value;
 $('#symbol-icon').innerHTML=symbol.svg;$('#symbol-icon').setAttribute('aria-label',`${symbol.name} · ${symbol.meaning}`);$('#symbol-card-title').textContent=`${target}의 수호 상징`;$('#symbol-card-meaning').textContent=`${symbol.name} · ${symbol.meaning}`;$('#symbol-card-reflection').textContent=reflection||'지키고 싶은 마음을 이 모양에 담습니다.';$('#symbol-card-impression').textContent=[before?`처음: ${before}`:'',after?`지금: ${after}`:''].filter(Boolean).join(' → ');
 state.resultText=['나만의 수호 상징',`지키고 싶은 것: ${target}`,`상징: ${symbol.name} · ${symbol.meaning}`,reflection?`나의 한 문장: ${reflection}`:'',before?`처음: ${before}`:'',after?`지금: ${after}`:'','《천 년 전의 경고》 관람 기록 · 현대적 창작 상징'].filter(Boolean).join('\n');state.resultGenerated=true;$('#symbol-result').hidden=false;$('#copy-status').textContent='카드가 만들어졌습니다. 선택과 문장을 바꾸면 카드도 갱신됩니다.';$('#copy-fallback').hidden=true;return true;
}
$('#symbol-form').addEventListener('submit',event=>{event.preventDefault();if(!$('#symbol-form').checkValidity()){$('#symbol-form').reportValidity();return;}renderSymbolCard();});
$('#reflection').addEventListener('input',()=>{$('#reflection-status').textContent=`${$('#reflection').value.length} / 240자 · 서버 전송·영구 저장 없음`;if(state.resultGenerated)renderSymbolCard();});
['protect-target','protect-symbol'].forEach(id=>$(`#${id}`).addEventListener('change',()=>{if(state.resultGenerated){if(!renderSymbolCard()){$('#symbol-result').hidden=true;state.resultGenerated=false;state.resultText='';}}}));
$$('input[name="impression"],input[name="first-impression"]').forEach(input=>input.addEventListener('change',()=>{updateBeforeImpression();if(state.resultGenerated)renderSymbolCard();}));
$('#copy-symbol').addEventListener('click',async()=>{
 if(!state.resultText)return;const text=state.resultText;
 try{if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');await navigator.clipboard.writeText(text);$('#copy-status').textContent='결과 텍스트를 복사했습니다.';}
 catch(error){$('#copy-fallback').value=text;$('#copy-fallback').hidden=false;$('#copy-fallback').focus();$('#copy-fallback').select();$('#copy-status').textContent='자동 복사를 사용할 수 없어 텍스트를 선택했습니다. Ctrl+C 또는 ⌘C로 복사해 주세요.';}
});
$('#restart').addEventListener('click',()=>{
 state.detail=null;state.observed.clear();state.comparison=initialComparison();state.resultGenerated=false;state.resultText='';
 $('#roof-detail-title').textContent=initialRoofText.title;$('#roof-detail-copy').textContent=initialRoofText.copy;$$('[data-roof]').forEach(button=>button.setAttribute('aria-pressed','false'));
 ['symbol-card-title','symbol-card-meaning','symbol-card-reflection','symbol-card-impression'].forEach(id=>$(`#${id}`).textContent='');$('#symbol-icon').replaceChildren();$('#copy-fallback').value='';
 $$('input[type="radio"]').forEach(input=>input.checked=false);$('#symbol-form').reset();$('#symbol-result').hidden=true;$('#copy-fallback').hidden=true;$('#copy-status').textContent='';$('#reflection-status').textContent='입력은 서버로 전송하거나 영구 저장하지 않습니다.';
 $$('[data-detail]').forEach(button=>button.setAttribute('aria-pressed','false'));$('#detail-title').textContent='어떤 모양이 보이나요?';$('#detail-copy').textContent='아직 선택하지 않았습니다. 실제 기와를 먼저 천천히 살펴보세요.';$('#observation-progress').textContent='살펴본 단서 0 / 3 · 순서는 자유롭습니다.';
 [['intro-reveal','intro-imagination','상상 속 수호자 보기 ✦'],['observe-reveal','observe-imagination','단서를 살펴본 뒤 수호자 해석 보기']].forEach(([button,panel,label])=>{$(`#${button}`).setAttribute('aria-expanded','false');$(`#${button}`).textContent=label;$(`#${panel}`).hidden=true;});$('#observe-reveal').disabled=true;
 $$('[data-layer-toggle]').forEach(button=>setLayerVisibility(button.closest('.character-figure').querySelector('[data-layered]'),button,true));if(renderedScenes.has(3))renderComparison();updateObservationTransform();go(0);
});

// One audio element; no autoplay or page-wide gesture listeners.
const music=$('#exhibition-music'),audioState={pending:false,operation:0,action:'idle'};music.volume=.35;
function updateAudioUI() {
 const playing=!music.paused;$$('[data-music-play]').forEach(button=>{button.setAttribute('aria-pressed',String(playing));button.setAttribute('aria-busy',String(audioState.pending));button.title=audioState.pending?'음악을 불러오는 중입니다. 정지로 취소할 수 있습니다.':playing?'배경음악 재생 중':'배경음악 재생';});
}
async function playMusic() {
 if(audioState.pending||!music.paused)return;const operation=++audioState.operation;audioState.action='play';audioState.pending=true;$('#music-status').textContent='음악 불러오는 중 · 정지로 취소할 수 있습니다.';updateAudioUI();
 try{await music.play();if(operation!==audioState.operation)return;if(document.hidden){music.pause();return;}$('#music-status').textContent='재생 중 · 곁을 지키는 밤';}
 catch(error){if(operation===audioState.operation)$('#music-status').textContent='음악을 재생하지 못했습니다. 재생을 다시 눌러 주세요. 전시는 계속 관람할 수 있습니다.';}
 finally{if(operation===audioState.operation){audioState.pending=false;updateAudioUI();}}
}
function stopMusic() {++audioState.operation;audioState.action='stop';audioState.pending=false;music.pause();try{music.currentTime=0;}catch(error){/* The media resource may not be seekable yet. */}$('#music-status').textContent='정지 · 음악을 처음으로 되돌렸습니다.';updateAudioUI();}
$$('[data-music-play]').forEach(button=>button.addEventListener('click',playMusic));$$('[data-music-stop]').forEach(button=>button.addEventListener('click',stopMusic));
$('#music-volume').addEventListener('input',event=>{const value=clamp(Number(event.target.value),0,100);music.volume=value/100;$('#volume-value').textContent=`${value}%`;event.target.setAttribute('aria-valuetext',`${value}퍼센트`);});
$('#music-volume').setAttribute('aria-valuetext','35퍼센트');
music.addEventListener('play',updateAudioUI);music.addEventListener('pause',()=>{if(audioState.action==='play'&&!audioState.pending)$('#music-status').textContent='일시정지 · 재생을 누르면 이어집니다.';updateAudioUI();});music.addEventListener('waiting',()=>{if(!music.paused)$('#music-status').textContent='음악 버퍼링 중';});music.addEventListener('playing',()=>{if(!audioState.pending)$('#music-status').textContent='재생 중 · 곁을 지키는 밤';updateAudioUI();});
music.addEventListener('error',()=>{++audioState.operation;audioState.action='error';audioState.pending=false;music.pause();$('#music-status').textContent='음악 파일을 불러오지 못했습니다. 전시는 계속 관람할 수 있습니다.';updateAudioUI();});
function pauseOnLeave() {const active=!music.paused||audioState.pending;++audioState.operation;audioState.action='leave';audioState.pending=false;music.pause();if(active)$('#music-status').textContent='탭을 벗어나 일시정지했습니다. 재생을 누르면 이어집니다.';updateAudioUI();}
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseOnLeave();});window.addEventListener('pagehide',pauseOnLeave);
navigate(Math.max(0,sceneIds.indexOf(location.hash.slice(1))),false);updateAudioUI();
