import React, { useState, useEffect, useRef, useCallback } from 'react'
import ReactDOM from 'react-dom/client'
import { loadSession, saveSession, clearSession, touchSession, startSessionWatcher, stopSessionWatcher, consumeExpiredFlag } from './session.js'

/* ══ APP.JS ══  Updated to use Dashboard */ 
;(function(){
const {useState,useEffect,useRef,useCallback,useMemo}=React;
/* ══ CHỈ RENDER KHI CẦN ══
   Trước đây mọi state của App (lịch sử, lớp, bậc, thông báo, modal…) đổi là CẢ Dashboard render lại,
   kể cả khi nó đang bị ẩn (display:none) vì học sinh đang ở màn Nghe / Từ vựng / Ôn tập.
   • memoStable: bọc component bằng React.memo; các prop kiểu hàm (arrow function tạo mới mỗi lần render)
     được thay bằng hàm ổn định luôn gọi bản MỚI NHẤT → không còn closure cũ, mà cũng không render thừa.
   • HiddenGate: khi đang ẩn thì đóng băng (không render lại); hiện lại → render ngay bản mới nhất. */
function memoStable(Comp){
  const Inner=React.memo(Comp);
  return function Stable(props){
    const latest=React.useRef(props); latest.current=props;
    const fns=React.useRef({});
    const out={};
    for(const k in props){
      const v=props[k];
      if(typeof v==='function'){
        if(!fns.current[k])fns.current[k]=(...a)=>{const f=latest.current[k];return typeof f==='function'?f(...a):undefined;};
        out[k]=fns.current[k];
      }else out[k]=v;
    }
    return React.createElement(Inner,out);
  };
}
const HiddenGate=React.memo(function HiddenGate({children}){return children;},(a,b)=>!!b.hidden&&!!a.hidden);
const Dashboard=memoStable(window.Dashboard);
const PwGate=window.PwGate;
const HistDetailModal=window.HistDetailModal;
// ★ Perf: QuizPlayer/ListeningPractice/VocabPractice/PracticeScreen không
// còn đọc thẳng từ window.X ở đây — 4 file này không còn eager-import
// trong main.jsx (xem giải thích ở đó). Dùng state + import() động bên
// dưới, chỉ tải khi màn hình tương ứng lần đầu được cần tới.

// ★ Perf: fallback nhẹ hiện trong lúc chờ import() động của 1 trong 4
// màn hình lớn (QuizPlayer/ListeningPractice/VocabPractice/PracticeScreen)
// tải xong — thường chỉ vài trăm ms trên mạng bình thường. Dùng @keyframes
// spin đã có sẵn ở index.html, không thêm animation mới.
function LazyScreenFallback({dark}){
  return(
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh'}}>
      <div style={{
        width:34,height:34,borderRadius:'50%',
        border:`3px solid ${dark?'rgba(255,255,255,0.15)':'rgba(26,176,245,0.15)'}`,
        borderTopColor:dark?'#1AB0F5':'#1AB0F5',
        animation:'spin .7s linear infinite',
      }}/>
    </div>
  );
}

// Bắt lỗi màn làm bài: không để cả app sập; báo lên App để hoàn lượt + quay về danh sách.
class QuizBoundary extends React.Component{
  constructor(p){super(p);this.state={err:false};}
  static getDerivedStateFromError(){return{err:true};}
  componentDidCatch(e){console.error('[quiz] màn làm bài lỗi:',e);if(this.props.onError)this.props.onError(e);}
  render(){return this.state.err?null:this.props.children;}
}

function App(){
  const [dark,setDark]=useState(()=>{
    if(window.__darkInit!==undefined)return window.__darkInit;
    try{
      var stored=localStorage.getItem('learnsy_dark');
      if(stored==='1')return true;
      if(stored==='0')return false;
    }catch(e){}
    return window.matchMedia&&window.matchMedia('(prefers-color-scheme:dark)').matches;
  });
  const [screen,setScreen]=useState('dashboard');// 'dashboard'|'pw'|'playing'
  const [homeTab,setHomeTab]=useState('lessons');// 'lessons'|'listening' — tab giống bên admin
  const [lessons,setLessons]=useState([]);
  // Bài "Ôn tập riêng" (category='practice') được TÁCH RIÊNG khỏi danh sách
  // "Bài học" thường — không cho lẫn vào tab home, và chỉ hiện cho học sinh
  // khi is_published=true, y hệt cơ chế fetchLessons()/fetchPracticeLessons()
  // bên app Android (LessonRepository.kt).
  const [loading,setLoading]=useState(true);
  const [fetchError,setFetchError]=useState(false);
  const [currentLesson,setCurrentLesson]=useState(null);
  const [pendingLesson,setPendingLesson]=useState(null);
  // ★ Học vui / Học cấp tốc: {lesson,mode} + chế độ chờ mở khóa mật khẩu
  const [funSession,setFunSession]=useState(null);
  const [pendingMode,setPendingMode]=useState(null);
  // Lịch sử luôn theo TỪNG học sinh (khóa ls_student_hist_<id>), nạp sau khi
  // biết đang đăng nhập là ai — không dùng khóa chung nữa (trước đây học sinh
  // A đăng xuất, học sinh B đăng nhập trên cùng máy có thể thấy lịch sử của A).
  const [history,setHistory]=useState([]);
  const [historyLoading,setHistoryLoading]=useState(false);
  // Mở lại app sau >72h: loadSession() (chạy ở useState bên dưới) đã dọn phiên và ghi cờ;
  // nếu có cờ thì hiện thông báo để học sinh hiểu vì sao phải đăng nhập lại.
  const [sessionNotice,setSessionNotice]=useState('');
  const [histDetail,setHistDetail]=useState(null);
  const [shuffleQ,setShuffleQ]=useState(false);
  const [shuffleA,setShuffleA]=useState(false);

  // ── Student Auth ──
  // loadSession(): trả null nếu phiên đã quá 72h không hoạt động (và tự dọn sạch).
  const [student,setStudent]=useState(()=>loadSession());
  const [authChecked,setAuthChecked]=useState(false);

  // ── Lớp của học sinh (lấy từ bảng students, khớp với tab "Học sinh" bên admin) ──
  // Bài có target_classes = mảng → chỉ học sinh thuộc các lớp đó thấy; null/không có = tất cả học sinh.
  const [studentClass,setStudentClass]=useState(()=>String(student?.class_name||'').trim());
  // ── Phân bậc Free/Premium (cấu hình ở admin → tier_settings) ──
  const [tierTick,setTierTick]=useState(0);
  const [tierLock,setTierLock]=useState(null); // {reason}
  useEffect(()=>{
    const T=window.LearnsyTier; if(!T)return;
    const off=T.subscribe(()=>setTierTick(n=>n+1));
    T.load();
    return off;
  },[]);
  useEffect(()=>{
    if(!student?.id&&!student?.username){setStudentClass('');return;}
    let alive=true;
    const load=async()=>{
      try{
        const mk=(cols)=>student?.id
          ?window.supa.from('students').select(cols).eq('id',student.id).maybeSingle()
          :window.supa.from('students').select(cols).eq('username',student.username).maybeSingle();
        let{data,error}=await mk('class_name,tier,premium_until,perks');
        if(error)({data,error}=await mk('class_name,tier,premium_until'));
        if(error)({data,error}=await mk('class_name')); // chưa chạy migration phân bậc
        if(alive&&!error&&data){
          setStudentClass(String(data.class_name||'').trim());
          if(window.LearnsyTier)window.LearnsyTier.setStudent({class_name:data.class_name,tier:data.tier||null,premium_until:data.premium_until||null,perks:data.perks||null});
        }
      }catch(e){}
    };
    load();
    window.addEventListener('learnsy:student-saved',load);
    return()=>{alive=false;window.removeEventListener('learnsy:student-saved',load);};
  },[student?.id,student?.username]);
  const canSeeLesson=useCallback(l=>{
    if(!Array.isArray(l.target_classes))return true;
    const mine=studentClass.toLowerCase();
    return !!mine&&l.target_classes.some(c=>String(c||'').trim().toLowerCase()===mine);
  },[studentClass]);
  // Bài "Ôn tập riêng" (category='practice') tách riêng khỏi "Bài học" thường, chỉ hiện khi is_published=true
  const normalLessons=useMemo(()=>{
    const base=lessons.filter(l=>l.category!=='practice'&&!String(l.category||'').startsWith('archived_')&&canSeeLesson(l));
    const T=window.LearnsyTier;
    return T?base.map(l=>({...l,tierLocked:!!l.tierLocked||T.lessonLocked(l,base)})):base;
  },[lessons,canSeeLesson,tierTick]);
  const practiceLessons=useMemo(()=>lessons.filter(l=>l.category==='practice'&&l.is_published&&canSeeLesson(l)),[lessons,canSeeLesson]);
  useEffect(()=>{
    if(consumeExpiredFlag())setSessionNotice('Phiên đăng nhập đã hết hạn do 72 giờ không hoạt động. Vui lòng đăng nhập lại.');
  },[]);

  // ★ Perf: lazy-load 4 màn hình lớn (QuizPlayer, ListeningPractice,
  // VocabPractice, PracticeScreen) — chỉ import() khi thật sự cần, không
  // phải lúc app mount. Mỗi file tự gán window.X ở cuối module (side
  // effect của import), nên chỉ cần "đợi import xong" rồi đọc lại
  // window.X là có component, không cần đổi cách các file kia export.
  const [lazyReady,setLazyReady]=useState({
    QuizPlayer:window.QuizPlayer||null,
    ListeningPractice:window.ListeningPractice||null,
    VocabPractice:window.VocabPractice||null,
    PracticeScreen:window.PracticeScreen||null,
    FunStudy:window.FunStudy||null,
  });
  const loadingLazyRef=useRef({});
  // Lượt làm bài vừa đếm (Free). refundable=true cho tới khi màn làm bài hiển thị được; lỗi trước đó → hoàn lượt.
  const attemptRef=useRef(null);
  const refundAttempt=useCallback(()=>{
    const a=attemptRef.current; if(!a||!a.refundable)return; a.refundable=false;
    try{if(window.LearnsyTier&&window.LearnsyTier.refundAttempt)window.LearnsyTier.refundAttempt(a.tk);}catch(e){}
    try{
      const t=window.LearnsySession?.getToken?.();
      if(t&&a.lessonId!=null)fetch('/api/lessons',{method:'POST',headers:{Authorization:'Bearer '+t,'Content-Type':'application/json'},body:JSON.stringify({refund:String(a.lessonId)})}).catch(()=>{});
    }catch(e){}
  },[]);
  const failQuiz=useCallback((msg)=>{
    refundAttempt();setScreen('dashboard');setCurrentLesson(null);
    try{alert(msg);}catch(e){}
  },[refundAttempt]);
  useEffect(()=>{
    if(screen!=='playing')return undefined;
    const t=setTimeout(()=>{const a=attemptRef.current;if(a&&a.refundable)failQuiz('Không mở được bài làm. Lượt làm bài đã được hoàn lại, bạn thử lại nhé!');},8000);
    return()=>clearTimeout(t);
  },[screen,currentLesson,failQuiz]);
  const ensureLazy=useCallback((name,importer)=>{
    if(window[name]||loadingLazyRef.current[name])return;
    loadingLazyRef.current[name]=true;
    importer().then(()=>{
      setLazyReady(prev=>({...prev,[name]:window[name]||null}));
    }).catch(e=>{
      loadingLazyRef.current[name]=false;
      console.error(`[app] lazy-load ${name} thất bại:`,e);
      if(name==='QuizPlayer')refundAttempt();
    });
  },[]);

  const doStudentLogin=useCallback(async(username,password)=>{
    try{
      // /api/session: kiểm tra mật khẩu (qua Edge Function cũ) rồi cấp token ký 72h
      let data=null;
      try{
        const res=await fetch('/api/session',{
          method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({username,password}),
        });
        data=await res.json().catch(()=>null);
        // 429 = bị khóa tạm vì sai quá nhiều lần: hiện thông báo, KHÔNG rơi xuống đường cũ
        // (nếu rơi xuống Edge Function trực tiếp thì việc khóa vô nghĩa).
        if(res.status===429)return{ok:false,msg:(data&&data.msg)||'Sai quá nhiều lần, vui lòng thử lại sau.'};
        if(res.status===500||res.status===404)data=null; // chưa cấu hình → dùng đường cũ
      }catch{data=null;}

      if(data&&data.ok){
        saveSession(data.student,data.token);
        setSessionNotice('');
        setStudent(data.student);
        return{ok:true};
      }
      if(data&&data.ok===false)return{ok:false,msg:data.msg||'Đăng nhập thất bại!'};

      // Đường cũ (dự phòng khi /api/session chưa sẵn sàng): không có token
      const {data:d2,error}=await supa.functions.invoke('student-login',{body:{username,password}});
      if(error){console.error('[doStudentLogin] Edge Function error:',error);return{ok:false,msg:'Lỗi kết nối, thử lại nhé!'};}
      if(!d2?.ok)return{ok:false,msg:d2?.msg||'Đăng nhập thất bại!'};
      saveSession(d2.student,null);
      setSessionNotice('');
      setStudent(d2.student);
      return{ok:true};
    }catch(e){console.error('[doStudentLogin]',e);return{ok:false,msg:'Lỗi kết nối, thử lại nhé!'};}
  },[]);

  // Đăng xuất: dọn phiên + cache lịch sử của user này. KHÔNG xóa dữ liệu trên
  // server (lịch sử vẫn còn cho lần đăng nhập sau — đúng ý nghĩa "đăng xuất").
  const doStudentLogout=useCallback((reason)=>{
    const uid=(loadSession()||{}).id;
    clearSession();
    try{
      if(uid)localStorage.removeItem('ls_student_hist_'+uid);
      localStorage.removeItem('ls_student_hist'); // khóa chung đời cũ
    }catch{}
    setStudent(null);
    setHistory([]);
    setScreen('dashboard');
    setCurrentLesson(null);
    if(reason==='expired')setSessionNotice('Phiên đăng nhập đã hết hạn do 72 giờ không hoạt động. Vui lòng đăng nhập lại.');
    else if(reason==='deleted')setSessionNotice('Tài khoản này không còn tồn tại. Hãy liên hệ giáo viên.');
    else if(reason==='locked')setSessionNotice('Tài khoản đang bị khóa. Hãy liên hệ giáo viên.');
  },[]);

  // Server báo token hết hạn/không hợp lệ (401) → bắt đăng nhập lại
  useEffect(()=>{
    const onUnauth=()=>{
      if(!loadSession())return;
      doStudentLogout('expired');
    };
    window.addEventListener('learnsy:unauthorized',onUnauth);
    return()=>window.removeEventListener('learnsy:unauthorized',onUnauth);
  },[doStudentLogout]);

  // ── Theo dõi phiên: hết 72h không hoạt động → tự đăng xuất ──
  useEffect(()=>{
    if(!student)return;
    touchSession(true);
    const stop=startSessionWatcher((why)=>doStudentLogout(why==='other-tab'?'other-tab':'expired'));
    return()=>{stop();};
  },[student?.id,doStudentLogout]);

  useEffect(()=>setAuthChecked(true),[]);

  // ── Sync background settings ngay khi login/logout ──
  useEffect(()=>{
    if(typeof window.__setBgSyncId==='function'){
      window.__setBgSyncId(student?.id||null);
    }
  },[student?.id]);

  // ── Nạp lịch sử: cache local hiện ngay, server là nguồn sự thật ──
  // Quy tắc quan trọng: server trả DANH SÁCH RỖNG là thông tin hợp lệ (đã xóa
  // hết) → phải xóa cache theo. Chỉ khi LỖI mạng/server mới giữ nguyên cache.
  const refreshHistory=useCallback(async()=>{
    const uid=student?.id;
    if(!uid||typeof window.loadQuizHistory!=='function')return;
    const cacheKey='ls_student_hist_'+uid;
    setHistoryLoading(true);
    const res=await window.loadQuizHistory(uid);
    setHistoryLoading(false);
    if(!res.ok)return;                       // lỗi mạng → giữ cache, không ghi đè
    setHistory(res.rows);
    try{
      if(res.rows.length)localStorage.setItem(cacheKey,JSON.stringify(res.rows));
      else localStorage.removeItem(cacheKey); // server rỗng → cache cũng phải rỗng
    }catch{}
  },[student?.id]);

  useEffect(()=>{
    if(!student?.id){setHistory([]);return;}
    const cacheKey='ls_student_hist_'+student.id;
    try{
      const cached=JSON.parse(localStorage.getItem(cacheKey)||'[]');
      setHistory(Array.isArray(cached)?cached:[]);
    }catch{setHistory([]);}
    refreshHistory();
  },[student?.id,refreshHistory]);

  // Đồng bộ lại khi: quay lại tab, có mạng lại, hoặc hàng đợi offline vừa gửi xong
  useEffect(()=>{
    if(!student?.id)return;
    const onVis=()=>{if(document.visibilityState==='visible')refreshHistory();};
    const onSynced=()=>refreshHistory();
    document.addEventListener('visibilitychange',onVis);
    window.addEventListener('online',onSynced);
    window.addEventListener('learnsy:results-synced',onSynced);
    return()=>{
      document.removeEventListener('visibilitychange',onVis);
      window.removeEventListener('online',onSynced);
      window.removeEventListener('learnsy:results-synced',onSynced);
    };
  },[student?.id,refreshHistory]);

  C=dark?CD:CL;
  useEffect(()=>{
    document.body.classList.toggle('dark',dark);
    document.documentElement.classList.toggle('dark',dark);
    // Persist để pre-init script đọc đúng lần sau
    try{localStorage.setItem('learnsy_dark',dark?'1':'0');}catch(e){}
    // Đồng bộ lại background sau khi dark class thay đổi từ React
    if(typeof window.applyBackground==='function'&&typeof window.loadBgSettings==='function'){
      window.applyBackground(window.loadBgSettings(),dark);
    }
  },[dark]);

  const lessonsReloadRef=useRef(null);
  // ── Fetch lessons: Upstash cache → Supabase (nguồn thật) ──
  // Đã bỏ bước gọi /api/lessons: endpoint đó KHÔNG tồn tại trong
  // functions/api (luôn 404) nên mỗi lần mở app chỉ tốn thêm 1 request thừa.
  useEffect(()=>{
    const mapRow=r=>({id:r.id,title:r.title||'',subject:r.subject||'Tiếng Anh',password:r.password||'',timerLimit:r.timerLimit||0,questions:r.questions||[],questionCount:r.questionCount??(r.questions||[]).length,tierLocked:!!r.tierLocked,needFetch:!!r.needFetch,tierCut:r.tierCut||null,category:r.category||'normal',is_published:!!r.is_published,qc_passed:!!r.qc_passed,target_classes:Array.isArray(r.target_classes)?r.target_classes:null});
    let alive=true;
    // silent=true: lần tải lại do đồng bộ (admin vừa đổi quyền/bài) — KHÔNG bật spinner, KHÔNG báo lỗi,
    // lỗi thì giữ nguyên danh sách đang hiện.
    const run=async(silent)=>{
      // ① API phía server: đã cắt theo bậc Free/Premium (không lộ phần bị khoá)
      try{
        const tk=window.LearnsySession?.getToken?.();
        if(tk){
          const r=await fetch('/api/lessons',{headers:{Authorization:'Bearer '+tk},cache:'no-store'});
          if(r.ok){
            const j=await r.json();
            if(j&&j.ok&&Array.isArray(j.lessons)){
              if(alive){setLessons(j.lessons.map(mapRow));setFetchError(false);setLoading(false);}
              return;
            }
          }
        }
      }catch(e){}
      if(silent){
        if(window.LearnsySession?.getToken?.())return; // có token mà API lỗi tạm thời → giữ danh sách đang hiện
        try{const{data,error}=await supa.from('lessons').select('*').order('created_at');if(alive&&!error&&data?.length)setLessons(data.map(mapRow));}catch(e){}
        return;
      }
      // ② Dự phòng (chưa deploy /api/lessons): đường cũ
      try{
        const cached=await upstashCmd('GET',CACHE_KEY);
        if(cached){
          const data=JSON.parse(cached);
          if(Array.isArray(data)&&data.length){
            if(alive){setLessons(data.map(mapRow));setLoading(false);}
            return;
          }
        }
      }catch(e){}
      // Thử tối đa 3 lần (mạng di động hay chập chờn); ghi lại lý do lỗi để hiện lên màn hình
      let lastMsg='';
      for(let attempt=0;attempt<3&&alive;attempt++){
        try{
          const{data,error}=await supa.from('lessons').select('*').order('created_at');
          if(!alive)return;
          if(error){lastMsg=error.message||String(error.code||'lỗi không rõ');console.error('[lessons] tải lỗi (lần '+(attempt+1)+'):',error);}
          else if(!data?.length){lastMsg='Máy chủ trả về 0 bài (kiểm tra quyền đọc bảng lessons / RLS)';console.warn('[lessons] '+lastMsg);}
          else{
            setFetchError(false);
            setLessons(data.map(mapRow));
            try{upstashCmd('SET',CACHE_KEY,JSON.stringify(data),'EX',CACHE_TTL);}catch(e){}
            lastMsg='';
            break;
          }
        }catch(e){
          lastMsg=(e&&e.message)||'Mất kết nối';console.error('[lessons] ngoại lệ:',e);
        }
        if(attempt<2)await new Promise(r=>setTimeout(r,800*(attempt+1)));
      }
      if(alive&&lastMsg)setFetchError(lastMsg);
      if(alive)setLoading(false);
    };
    let busy=false;
    lessonsReloadRef.current=async()=>{if(busy)return;busy=true;try{await run(true);}finally{busy=false;}};
    run(false);
    return()=>{alive=false;lessonsReloadRef.current=null;};
  },[]);

  // ── ĐỒNG BỘ admin → học sinh (không cần reload) ──
  // sync.js: quay lại tab / focus / mỗi ~30s kiểm tra hàng học sinh, cấu hình phân bậc,
  // phiên bản danh sách bài; đổi gì thì tải lại đúng phần đó.
  useEffect(()=>{
    const S=window.LearnsySync;
    if(!S||(!student?.id&&!student?.username))return;
    const offS=S.subscribe('student',({row})=>{
      if(row)setStudentClass(String(row.class_name||'').trim());
    });
    const offL=S.subscribe('lessons',()=>{lessonsReloadRef.current&&lessonsReloadRef.current();});
    S.start(student);
    return()=>{offS();offL();S.stop();};
  },[student?.id,student?.username]);

  const playLesson=async(lessonMeta)=>{
    if(lessonMeta.tierLocked){setTierLock({reason:'Bài này chỉ dành cho Premium.'});return;}
    ensureLazy('QuizPlayer',()=>import('./components/quiz-player.jsx'));
    if(lessonMeta.password){setPendingLesson(lessonMeta);setScreen('pw');return;}
    await loadAndPlay(lessonMeta);
  };

  const startFun=async(lessonMeta,mode)=>{
    lessonMeta=await ensureQuestions(lessonMeta);
    if(!lessonMeta)return;
    setFunSession({lesson:lessonMeta,mode});
    setScreen('fun');
    trackEvent({event:'lesson_start',lessonId:lessonMeta.id,subject:lessonMeta.subject,mode});
  };
  const playLessonMode=(lessonMeta,mode)=>{
    if(lessonMeta.tierLocked){setTierLock({reason:'Bài này chỉ dành cho Premium.'});return;}
    ensureLazy('FunStudy',()=>import('./components/fun-study.jsx'));
    if(lessonMeta.password){setPendingMode(mode);setPendingLesson(lessonMeta);setScreen('pw');return;}
    startFun(lessonMeta,mode);
  };

  // Free: danh sách không kèm câu hỏi → hỏi server (server cắt N câu + đếm lượt/ngày)
  const ensureQuestions=async(meta)=>{
    if(!meta.needFetch)return meta;
    const tk=window.LearnsySession?.getToken?.();
    try{
      const r=await fetch('/api/lessons?id='+encodeURIComponent(meta.id),{headers:{Authorization:'Bearer '+tk},cache:'no-store'});
      const j=await r.json().catch(()=>null);
      if(r.ok&&j&&j.ok&&j.lesson)return {...meta,...j.lesson,needFetch:false,tierLocked:false};
      if(r.status===429)setTierLock({reason:'Bạn đã hết lượt làm bài hôm nay (gói Free). Quay lại vào ngày mai nhé!'});
      else if(r.status===403)setTierLock({reason:'Bài này chỉ dành cho Premium.'});
      else alert('Không tải được bài. Vui lòng thử lại!');
    }catch(e){alert('Mất kết nối. Vui lòng thử lại!');}
    return null;
  };
  const loadAndPlay=async(lessonMeta)=>{
    lessonMeta=await ensureQuestions(lessonMeta);
    if(!lessonMeta)return;
    try{
      const T=window.LearnsyTier;
      const tk=student?.id||student?.username||'anon';
      if(T&&T.attemptsLeft(tk)<=0){setTierLock({reason:'Bạn đã hết lượt làm bài hôm nay (gói Free). Quay lại vào ngày mai nhé!'});return;}
      if(T)lessonMeta=T.cutQuestions(lessonMeta);
      if(T)T.noteAttempt(tk);
      attemptRef.current={tk,lessonId:lessonMeta.id,refundable:true};
      const prepared={...applyShuffleToLesson(lessonMeta,shuffleQ,shuffleA),timeLimit:lessonMeta.timerLimit||lessonMeta.timeLimit||0};
      if(!Array.isArray(prepared.questions)||!prepared.questions.length){refundAttempt();alert('Bài này chưa tải được câu hỏi. Lượt làm bài đã được hoàn lại, bạn thử lại nhé!');return;}
      setCurrentLesson(prepared);
      setScreen('playing');
      trackEvent({event:'lesson_start',lessonId:lessonMeta.id,subject:lessonMeta.subject});
    }catch(e){refundAttempt();alert('Không thể tải bài này. Vui lòng thử lại!');}
  };

  const onUnlockPw=async()=>{
    const pl=pendingLesson,pm=pendingMode;
    setPendingLesson(null);setPendingMode(null);setScreen('dashboard');
    if(pl&&pm){startFun(pl,pm);return;}
    if(pl)await loadAndPlay(pl);
  };

  // ── Lưu lịch sử: MỖI BÀI 1 DÒNG — làm lại thì ghi đè lần trước ──
  // Cùng 1 lần nộp (attemptId) không bị thêm 2 lần.
  const saveHistory=(rec)=>{
    const uid=student?.id;
    if(!uid)return;
    const entry={...rec,ts:rec.ts||new Date().toISOString()};
    trackEvent({event:'quiz_complete',lessonId:entry.lessonTitle,subject:entry.subject||'',score:entry.score,total:entry.total,pct:entry.pct});
    setHistory(prev=>{
      if(entry.attemptId&&prev.some(h=>h.attemptId===entry.attemptId))return prev;
      // Mỗi bài chỉ giữ 1 dòng: lần làm mới ĐÈ lên lần cũ của cùng bài (khớp theo ID bài, không có thì theo tên)
      const same=h=>entry.lessonId?String(h.lessonId)===String(entry.lessonId):(!!entry.lessonTitle&&h.lessonTitle===entry.lessonTitle);
      const updated=[entry,...prev.filter(h=>!same(h))].slice(0,200);
      try{localStorage.setItem('ls_student_hist_'+uid,JSON.stringify(updated));}catch{}
      return updated;
    });
    // Sau khi server lưu xong, kéo lại để có id thật (phục vụ xóa từng dòng)
    setTimeout(refreshHistory,1500);
  };

  // ── Xóa lịch sử: XÓA Ở SERVER trước, rồi mới xóa cache ──
  // Trước đây chỉ xóa localStorage nên lần tải sau lịch sử "hiện lại".
  // ids (tùy chọn): chỉ xóa các bản ghi này; bỏ trống = xóa toàn bộ.
  const clearHistory=async(ids)=>{
    const uid=student?.id;
    if(!uid)return{ok:false};
    const list=Array.isArray(ids)&&ids.length?ids.filter(x=>x!=null):null;
    const res=await window.deleteQuizHistory(uid,list);
    if(!res.ok){
      alert('Không xóa được lịch sử trên máy chủ. Kiểm tra mạng rồi thử lại nhé!');
      return{ok:false};
    }
    setHistory(prev=>{
      const next=list?prev.filter(h=>!list.includes(h.id)):[];
      try{
        if(next.length)localStorage.setItem('ls_student_hist_'+uid,JSON.stringify(next));
        else localStorage.removeItem('ls_student_hist_'+uid);
      }catch{}
      return next;
    });
    // Dọn cả hàng đợi offline của user này để bản chưa gửi không "hồi sinh"
    if(!list){
      try{
        const K='learnsy_pending_results_v2';
        const q=JSON.parse(localStorage.getItem(K)||'[]').filter(p=>p.studentId!==uid);
        if(q.length)localStorage.setItem(K,JSON.stringify(q));else localStorage.removeItem(K);
      }catch{}
    }
    return{ok:true,deleted:res.deleted};
  };

  if(!authChecked)return null;
  if(!student)return <StudentLoginScreen dark={dark} onLogin={doStudentLogin} notice={sessionNotice}/>;

  return(
    <>
      {screen==='pw'&&pendingLesson&&(
        <PwGate lesson={pendingLesson} dark={dark}
          onUnlock={onUnlockPw}
          onCancel={()=>{setPendingLesson(null);setPendingMode(null);setScreen('dashboard');}}/>
      )}
      {screen==='playing'&&currentLesson&&(()=>{
        const Comp=lazyReady.QuizPlayer;
        return Comp
          ? <QuizBoundary key={String(currentLesson.id)} onError={(e)=>failQuiz('Màn làm bài gặp lỗi'+(e&&e.message?' ('+String(e.message).slice(0,120)+')':'')+'. Lượt làm bài đã được hoàn lại, bạn vào lại giúp mình nhé!')}>
              <Comp lesson={currentLesson} dark={dark} setDark={setDark}
                student={student}
                onBack={()=>setScreen('dashboard')}
                onStarted={()=>{if(attemptRef.current)attemptRef.current.refundable=false;}}
                onSaveHistory={saveHistory}/>
            </QuizBoundary>
          : <LazyScreenFallback dark={dark}/>;
      })()}
      {screen==='fun'&&funSession&&(()=>{
        const Comp=lazyReady.FunStudy;
        return Comp
          ? <Comp lesson={funSession.lesson} mode={funSession.mode} dark={dark} student={student}
              onBack={()=>{setScreen('dashboard');setFunSession(null);}}/>
          : <LazyScreenFallback dark={dark}/>;
      })()}
      {screen==='dashboard'&&(
        <>
          <div style={{display:homeTab==='lessons'?'block':'none'}}>
            <HiddenGate hidden={homeTab!=='lessons'}>
            <Dashboard
              tierTick={tierTick}
              student={student}
              lessons={normalLessons}
              loading={loading}
              fetchError={fetchError}
              history={history}
              historyLoading={historyLoading}
              onRefreshHistory={refreshHistory}
              dark={dark}
              setDark={setDark}
              onPlay={playLesson}
              onPlayMode={playLessonMode}
              onClearHistory={clearHistory}
              onHistDetail={setHistDetail}
              shuffleQ={shuffleQ} setShuffleQ={setShuffleQ}
              shuffleA={shuffleA} setShuffleA={setShuffleA}
              onLogout={(r)=>doStudentLogout(typeof r==='string'?r:undefined)}
              onGoListening={()=>{if(window.LearnsyTier&&!window.LearnsyTier.can('listening')){setTierLock({reason:'Luyện nghe chỉ dành cho Premium.'});return;}ensureLazy('ListeningPractice',()=>import('./components/listening-practice.jsx'));setHomeTab('listening');}}
              onGoVocab={()=>{if(window.LearnsyTier&&!window.LearnsyTier.can('vocab')){setTierLock({reason:'Từ vựng chỉ dành cho Premium.'});return;}ensureLazy('VocabPractice',()=>import('./components/vocab-practice.jsx'));setHomeTab('vocab');}}
              onGoPractice={practiceLessons.length?()=>{if(window.LearnsyTier&&!window.LearnsyTier.can('practice')){setTierLock({reason:'Ôn tập riêng chỉ dành cho Premium.'});return;}ensureLazy('PracticeScreen',()=>import('./components/practice-screen.jsx'));setHomeTab('practice');}:undefined}
              practiceCount={practiceLessons.length}
            />
            </HiddenGate>
          </div>
          {homeTab==='listening'&&(()=>{
            const Comp=lazyReady.ListeningPractice;
            return Comp ? <Comp dark={dark} onBack={()=>setHomeTab('lessons')}/> : <LazyScreenFallback dark={dark}/>;
          })()}
          {homeTab==='vocab'&&(()=>{
            const Comp=lazyReady.VocabPractice;
            return Comp ? <Comp dark={dark} student={student} onBack={()=>setHomeTab('lessons')}/> : <LazyScreenFallback dark={dark}/>;
          })()}
          {homeTab==='practice'&&(()=>{
            const Comp=lazyReady.PracticeScreen;
            return Comp ? <Comp dark={dark} lessons={practiceLessons} loading={loading} onPlay={playLesson} onBack={()=>setHomeTab('lessons')}/> : <LazyScreenFallback dark={dark}/>;
          })()}
        </>
      )}
      {tierLock&&window.TierLockModal&&React.createElement(window.TierLockModal,{dark,reason:tierLock.reason,onClose:()=>setTierLock(null)})}
      {screen==='playing'&&currentLesson&&currentLesson.tierCut&&window.TierLockIcon&&(
        <div style={{position:'fixed',left:'50%',bottom:14,transform:'translateX(-50%)',zIndex:9000,maxWidth:'92vw',padding:'8px 14px',borderRadius:99,background:dark?'#2A2D32':'#1A1C1E',color:'#fff',fontSize:12.5,fontWeight:600,display:'flex',alignItems:'center',gap:6,pointerEvents:'none'}}>
          {React.createElement(window.TierLockIcon,{size:14})}Gói Free: {currentLesson.tierCut.shown}/{currentLesson.tierCut.total} câu
        </div>
      )}
      {histDetail&&<HistDetailModal h={histDetail} dark={dark} onClose={()=>setHistDetail(null)}/>}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
})();